import crypto from "node:crypto";
import https from "node:https";

import { HttpsProxyAgent } from "https-proxy-agent";
import { getResidentialProxyUrl } from "@/lib/proxy";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

const BASE_HOST = "registro.telcel.com";
const LOG_PREFIX = "[telcel]";
const LOOKUP_MAX_ATTEMPTS = 2;
const LOOKUP_RETRY_DELAYS_MS = [1000];
const VALIDATION_MAX_ATTEMPTS = 2;
const VALIDATION_RETRY_DELAYS_MS = [250];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomHex(size: number) {
  return crypto.randomBytes(size).toString("hex").toUpperCase();
}

function randomAlphaNum(size: number) {
  return crypto
    .randomBytes(size * 2)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, size);
}

function randomSendBy() {
  return [
    "t3l",
    randomAlphaNum(8),
    randomAlphaNum(4),
    randomAlphaNum(6),
    randomAlphaNum(6),
    randomAlphaNum(8),
  ].join("-");
}

function generateJWT() {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: "PRB", iat: now, exp: now + 3600 }),
  ).toString("base64url");

  const signature = crypto.randomBytes(32).toString("base64url").slice(0, 43);

  return `${header}.${payload}.${signature}`;
}

function logTelcel(message: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`${LOG_PREFIX} ${message}`);
    return;
  }

  console.log(`${LOG_PREFIX} ${message}`, stripCURPs(payload));
}

function buildHeaders() {
  return {
    applicationid: "PRB",
    channel: "CZA",
    "content-type": "application/json",
    messageuuid: `SIS${randomHex(12)}`,
    sendby: randomSendBy(),
    origin: "https://registro.telcel.com",
    referer: "https://registro.telcel.com/vinculatulinea/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    token: generateJWT(),
  };
}

type ValidationResponseData = {
  errorList?: Array<{
    code: string;
    description: string;
    businessMeaning?: string;
  }>;
  process?: {
    id?: string;
  };
  [key: string]: unknown;
};

async function postJSON<T>(
  path: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  raw: string;
}> {
  const proxyUrl = getResidentialProxyUrl();

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: BASE_HOST,
        path,
        method: "POST",
        headers,
        rejectUnauthorized: false,
        timeout: 10000,
        agent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          let parsed: T | null = null;

          try {
            parsed = JSON.parse(data);
          } catch {}

          resolve({
            ok: res.statusCode === 200,
            status: res.statusCode || 0,
            data: parsed,
            raw: data,
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, data: null, raw: "timeout" });
    });

    req.on("error", (e) => {
      resolve({ ok: false, status: 0, data: null, raw: String(e) });
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

// Telcel's WAF (Shape/Akamai-style bot filter) rejects requests it flags as
// automated with a 403 and this specific error code, rather than any real
// authorization failure (there's no legitimate "wrong credentials" 403 case
// here since this is an unauthenticated public lookup form). Treat it the
// same as a network/5xx blip: retry with a fresh proxy pick, since the block
// is tied to the request fingerprint/IP, not the CURP being looked up.
const WAF_BLOCK_ERROR_CODE = "ESE_CBI_CON_0012";

function isWAFBlock(raw: string) {
  return raw.includes(WAF_BLOCK_ERROR_CODE);
}

function isRetryableResponse(status: number, raw: string) {
  return (
    status === 0 ||
    status >= 500 ||
    raw === "timeout" ||
    (status === 403 && isWAFBlock(raw))
  );
}

async function validateEligibility(curp: string) {
  const body = {
    typePerson: "F",
    claveIdentidad: curp,
    processSpecs: {
      type: "CONS",
      category: "AUTO",
    },
  };

  for (let attempt = 0; attempt < VALIDATION_MAX_ATTEMPTS; attempt += 1) {
    const response = await postJSON<ValidationResponseData>(
      "/process-api/v1/process/elegibility",
      body,
      buildHeaders(),
    );

    if (
      response.ok ||
      attempt === VALIDATION_MAX_ATTEMPTS - 1 ||
      !isRetryableResponse(response.status, response.raw)
    ) {
      return response;
    }

    const delay =
      VALIDATION_RETRY_DELAYS_MS[attempt] ||
      VALIDATION_RETRY_DELAYS_MS.at(-1) ||
      250;

    await sleep(delay);
  }

  logTelcel("validation exhausted retries");
  return {
    ok: false,
    status: 0,
    data: null,
    raw: "validation exhausted retries",
  };
}

function hasErrorCode(data: ValidationResponseData | null, code: string) {
  return data?.errorList?.some((error) => error.code === code) ?? false;
}

export async function lookupCURPInTelcel(curp: string): Promise<LineResult> {
  try {
    for (let attempt = 0; attempt < LOOKUP_MAX_ATTEMPTS; attempt += 1) {
      const validationResponse = await validateEligibility(curp);
      const data = validationResponse.data;

      if (
        hasErrorCode(data, "BE_MP_BPS_0053") &&
        attempt < LOOKUP_MAX_ATTEMPTS - 1
      ) {
        const delay =
          LOOKUP_RETRY_DELAYS_MS[attempt] ||
          LOOKUP_RETRY_DELAYS_MS.at(-1) ||
          250;

        await sleep(delay);
        continue;
      }

      if (!validationResponse.ok) {
        return {
          company: "Telcel",
          lines: [],
          error: `Validation failed (${validationResponse.status})`,
          temporaryUnavailable: isRetryableResponse(
            validationResponse.status,
            validationResponse.raw,
          ),
          rawApiResponse: validationResponse.raw,
        };
      }

      if (!data) {
        return {
          company: "Telcel",
          lines: [],
          error: "Empty validation response",
        };
      }

      if (data.errorList && data.errorList.length > 0) {
        const noLines = data.errorList.some(
          (err) => err.code === "BE_MP_BPS_0041",
        );

        if (noLines) {
          return {
            company: "Telcel",
            lines: [],
            isRegistered: false,
          };
        }

        return {
          company: "Telcel",
          lines: [],
          error:
            data.errorList[0].businessMeaning || data.errorList[0].description,
          rawApiResponse: data,
        };
      }

      if (data.process?.id) {
        return {
          company: "Telcel",
          lines: [],
          isRegistered: true,
          rawApiResponse: data,
        };
      }

      return {
        company: "Telcel",
        lines: [],
        error: "Unexpected Telcel response",
        rawApiResponse: data,
      };
    }

    return {
      company: "Telcel",
      lines: [],
      error: "Could not validate Telcel eligibility",
      temporaryUnavailable: true,
    };
  } catch (e) {
    return {
      company: "Telcel",
      lines: [],
      error: e instanceof Error ? e.message : "Unknown error",
      temporaryUnavailable: true,
    };
  }
}
