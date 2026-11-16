import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

type VinocResponse = {
  found?: boolean;
  lines?: { msisdn_masked?: string; provider?: string }[];
};

export async function lookupCURPInVinoc(curp: string): Promise<LineResult> {
  const validationResponse = await fetch(
    "https://kyc.n3t.mx/api/kyc/consulta",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://kyc.n3t.mx",
        Referer: "https://kyc.n3t.mx/",
      },
      body: JSON.stringify({ id_type: "curp", value: curp }),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Vinoc:",
      validationResponse.status,
    );
    return {
      company: "Vinoc",
      lines: [],
      error: "Failed to validate CURP with Vinoc",
    };
  }

  const validationData = (await validationResponse.json()) as VinocResponse;

  if (typeof validationData?.found !== "boolean") {
    console.error(
      "[vinoc] unrecognized response shape, refusing to guess:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "Vinoc",
      lines: [],
      error: "Unrecognized response from Vinoc",
    };
  }

  const lines = (validationData.lines ?? []).filter((l) => l.msisdn_masked);

  if (!validationData.found || lines.length === 0) {
    return { company: "Vinoc", lines: [], isRegistered: false };
  }

  return {
    company: "Vinoc",
    lines: lines.map((l) => `${l.provider || "Vinoc"}: ${l.msisdn_masked}`),
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
