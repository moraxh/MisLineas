import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { createCipheriv } from "node:crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getResidentialProxyUrl } from "@/lib/proxy";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

const SECRET_KEY = "key_t3lcel_prod";

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = getResidentialProxyUrl();
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}

const FREEDOMPOP_PROVIDERS = [
  "AhorroCel",
  "Chedraui Móvil",
  "Freedompop",
  "OXXO CEL",
  "OUI",
  "Uber Cel",
  "Yobi Telecom",
];

function encryptCURP(curp: string): string {
  const key = Buffer.from(SECRET_KEY.substring(0, 16).padEnd(16, "\0"), "utf8");
  const cipher = createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([
    cipher.update(curp, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

function generateProcessId(): string {
  let id = "";
  for (let i = 0; i < 15; i++) id += Math.floor(Math.random() * 10).toString();
  return `OMV${id}`;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type FetchResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; transient: boolean; status?: number };

async function fetchSubscriptions(
  encryptedCURP: string,
): Promise<FetchResult> {
  const url =
    "https://vinculatulinea.com/omv-lineas/v1/omv-services/subscriptions-by-curp?pathName=freedompop&apiName=getSubscriptionsbyCURP";
  const auth = Buffer.from("admin:admin123").toString("base64");
  const response = await undiciFetch(url, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    method: "GET",
    dispatcher: getProxyAgent(),
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.6",
      authorization: `Basic ${auth}`,
      "content-type": "application/json",
      operation_context: "MY_LINES",
      priority: "u=1, i",
      processid: generateProcessId(),
      referer: "https://vinculatulinea.com/freedompop/my-lines",
      "sec-ch-ua": '"Chromium";v="149", "Not)A;Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      "x-client-data": encryptedCURP,
      "y-client-data": "false",
    },
  });

  const data = await response.json().catch(() => null) as Record<string, unknown> | null;

  if (!response.ok) {
    console.error(
      `[freedompop] HTTP ${response.status} — body:`,
      JSON.stringify(stripCURPs(data), null, 2),
    );
    return { ok: false, transient: true, status: response.status };
  }

  if (!data) {
    console.error("[freedompop] Empty or invalid JSON response");
    return { ok: false, transient: false };
  }

  if (data.responseCode === 3) {
    console.error("[freedompop] External service error:", data.responseMessage);
    return { ok: false, transient: true };
  }

  return { ok: true, data };
}

const BRAND_MAP: Record<string, string> = {
  oxxocel: "OXXO CEL",
  freedompop: "Freedompop",
  oui: "OUI",
  "uber cel": "Uber Cel",
  ahorrocel: "AhorroCel",
  "chedraui móvil": "Chedraui Móvil",
  "yobi telecom": "Yobi Telecom",
};

// Single endpoint covers all FREEDOMPOP_PROVIDERS; returns one result per brand
export async function lookupCURPInFreedompop(
  curp: string,
): Promise<LineResult[]> {
  const encryptedCURP = encryptCURP(curp);

  let result = await fetchSubscriptions(encryptedCURP);
  for (
    let attempt = 1;
    !result.ok && result.transient && attempt < MAX_ATTEMPTS;
    attempt++
  ) {
    await sleep(RETRY_DELAY_MS * attempt);
    result = await fetchSubscriptions(encryptedCURP);
  }

  if (!result.ok) {
    return FREEDOMPOP_PROVIDERS.map((company) => ({
      company,
      lines: [],
      error: result.transient
        ? `External service error from ${company}`
        : `Invalid response from ${company}`,
    }));
  }

  const data = result.data;

  if (
    data.responseCode === 0 &&
    Array.isArray(data.subscription) &&
    data.subscription.length === 0
  ) {
    return FREEDOMPOP_PROVIDERS.map((company) => ({
      company,
      lines: [],
      isRegistered: false,
    }));
  }

  const subscriptions = (data.subscription ?? []) as Array<{
    descripcion: string;
    msisdn: string;
  }>;

  const byBrand = new Map<string, string[]>();
  for (const sub of subscriptions) {
    const raw = sub.descripcion
      .replace(/^Número\s+/i, "")
      .replace(/:\s*$/, "")
      .trim();
    const brand = BRAND_MAP[raw.toLowerCase()] ?? raw;
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand)!.push(sub.msisdn);
  }

  return FREEDOMPOP_PROVIDERS.map((company) => {
    const lines = byBrand.get(company) ?? [];
    return {
      company,
      lines,
      isRegistered: lines.length > 0,
      ...(lines.length === 0 ? {} : { rawApiResponse: data }),
    };
  });
}
