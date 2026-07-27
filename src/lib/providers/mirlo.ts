import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInMirlo(curp: string): Promise<LineResult> {
  const validationResponse = await fetch(
    `https://apib.mirlo.com/api/v1/regulation/query/by-curp/${curp}`,
    { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Mirlo:",
      validationResponse.statusText,
    );

    return {
      company: "Mirlo",
      lines: [],
      error: "Failed to validate CURP with Mirlo",
    };
  }

  const validationData = await validationResponse.json();

  if (
    validationData.status === 404 &&
    validationData.message ===
      "No se encontró titular con el CURP proporcionado"
  ) {
    return {
      company: "Mirlo",
      lines: [],
      isRegistered: false,
    };
  }

  console.log(
    "[mirlo] registered response:",
    JSON.stringify(stripCURPs(validationData), null, 2),
  );
  return {
    company: "Mirlo",
    lines: [],
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
