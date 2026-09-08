import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

// documentType, as used by weex.mx/consultalineas.html: 1 = CURP, 2 = passport,
// 3 = RFC.
const DOCUMENT_TYPE_CURP = 1;

type WeexResponse = {
  obj?: { dnActiveByCurpRfc?: Array<{ msisdn?: string; provider?: string }> };
  error?: { code?: number; message?: string; retry?: number };
};

export async function loookupCURPINWeeex(curp: string): Promise<LineResult> {
  const validationResponse = await fetch(
    "https://app.weex.mx/ServiceLayer/Legislacion?ex=getDnActiveLines",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentType: DOCUMENT_TYPE_CURP,
        searchData: curp,
      }),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Weex:",
      validationResponse.statusText,
    );

    // A WAF block or a rate limit is not a lookup that failed, it's a lookup
    // that never ran — the user should be told to check the portal, not that
    // Weex is broken.
    const blocked =
      validationResponse.status === 403 || validationResponse.status === 429;

    return {
      company: "Weex",
      lines: [],
      temporaryUnavailable: blocked,
      error: blocked ? undefined : "Failed to validate CURP with Weex",
    };
  }

  const validationData = (await validationResponse
    .json()
    .catch(() => null)) as WeexResponse | null;

  // Weex answers 200 with an envelope: { obj, error: { code, message, retry } }.
  // Their own portal treats any non-zero error.code as a service failure rather
  // than an empty result, and the array comes back empty (or absent) in that
  // case. Reading that empty array as "no lines" tells the user nothing is
  // registered to their CURP when the lookup never actually happened.
  if (
    validationData?.error?.code !== undefined &&
    validationData.error.code !== 0
  ) {
    console.error(
      `[weex] business error ${validationData.error.code}: ${validationData.error.message ?? ""}`,
    );
    return { company: "Weex", lines: [], temporaryUnavailable: true };
  }

  // Optional chaining on purpose: an unexpected envelope must not throw and
  // take the whole provider down with it.
  const found = validationData?.obj?.dnActiveByCurpRfc ?? [];

  if (found.length === 0) {
    return {
      company: "Weex",
      lines: [],
      isRegistered: false,
    };
  }

  console.log(
    "[weex] registered response:",
    JSON.stringify(stripCURPs(validationData), null, 2),
  );
  return {
    company: "Weex",
    lines: [],
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
