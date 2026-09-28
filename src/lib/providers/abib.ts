import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInABIB(curp: string): Promise<LineResult> {
  const validationResponse = await fetch(
    `https://erp.abib.com.mx/api/lineas/${curp}`,
    { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with ABIB:",
      validationResponse.statusText,
    );

    return {
      company: "ABIB",
      lines: [],
      error: "Failed to validate CURP with ABIB",
    };
  }

  const validationData = await validationResponse.json();

  if (validationData.success === false) {
    return {
      company: "ABIB",
      lines: [],
      isRegistered: false,
    };
  }

  if (validationData.success === true) {
    console.log(
      "[abib] registered response:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "ABIB",
      lines: [],
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  console.error(
    "[abib] unrecognized response shape, refusing to guess:",
    JSON.stringify(stripCURPs(validationData), null, 2),
  );
  return {
    company: "ABIB",
    lines: [],
    error: "Unrecognized response shape from ABIB",
  };
}
