import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

const BASE_URL = "https://mobig.mx";
const SESSION_URL = `${BASE_URL}/vinculatulinea/consulta-curp`;
const SEARCH_URL = `${BASE_URL}/vinculacion/search-msisdns`;

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

export async function lookupCURPINMobig(curp: string): Promise<LineResult> {
  // Step 1: GET session page to obtain cookies and CSRF token
  const sessionResponse = await fetch(SESSION_URL, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    method: "GET",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "User-Agent": UA,
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
    },
    redirect: "follow",
  });

  if (!sessionResponse.ok) {
    console.error(`[mobig] session GET failed: ${sessionResponse.status}`);
    return {
      company: "Mobig",
      lines: [],
      error: "Failed to initialize session with Mobig",
    };
  }

  // Extract Set-Cookie headers
  const rawCookies = sessionResponse.headers.getSetCookie?.() ?? [];
  const cookieMap: Record<string, string> = {};
  for (const cookie of rawCookies) {
    const [pair] = cookie.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    cookieMap[name] = value;
  }

  // Extract CSRF token from HTML meta tag
  const html = await sessionResponse.text();
  const csrfMatch = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
  if (!csrfMatch) {
    console.error("[mobig] CSRF token not found in HTML");
    return {
      company: "Mobig",
      lines: [],
      error: "Failed to obtain CSRF token from Mobig",
    };
  }
  const csrfToken = csrfMatch[1];

  const cookieHeader = Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  // Step 2: POST search
  const searchResponse = await fetch(SEARCH_URL, {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/json",
      "User-Agent": UA,
      "X-CSRF-TOKEN": csrfToken,
      "X-Requested-With": "XMLHttpRequest",
      Origin: BASE_URL,
      Referer: SESSION_URL,
      Cookie: cookieHeader,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    },
    body: JSON.stringify({ curp }),
  });

  const data = await searchResponse.json().catch(() => null);

  if (!searchResponse.ok) {
    console.error(
      `[mobig] search POST failed: ${searchResponse.status}`,
      JSON.stringify(stripCURPs(data), null, 2),
    );
    return {
      company: "Mobig",
      lines: [],
      error: "Failed to validate CURP with Mobig",
    };
  }

  if (!data) {
    console.error("[mobig] empty or invalid JSON response");
    return {
      company: "Mobig",
      lines: [],
      error: "Invalid response from Mobig",
    };
  }

  // Mobig has flip-flopped between `data.data` being `[]` directly and
  // `{ last_digits, msisdns }` with `msisdns` being the empty array — accept both shapes.
  const msisdns = Array.isArray(data?.data) ? data.data : data?.data?.msisdns;
  if (Array.isArray(msisdns) && msisdns.length === 0) {
    return {
      company: "Mobig",
      lines: [],
      isRegistered: false,
    };
  }

  console.log(
    "[mobig] registered response:",
    JSON.stringify(stripCURPs(data), null, 2),
  );
  return {
    company: "Mobig",
    lines: [],
    isRegistered: true,
    rawApiResponse: data,
  };
}
