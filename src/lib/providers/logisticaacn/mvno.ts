import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import type { LineResult } from "@/types";

const possibleProviders = ["FedeGo!", "Flash Mobile", "Dua"];

export async function lookupCURPInLogisticaACN(
  curp: string,
): Promise<LineResult> {
  const validationResponse = await fetch(
    `https://ku.diri.mx/consultaRNU/${curp}`,
    { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Logistica ACN:",
      validationResponse.statusText,
    );

    return {
      company: "Logistica ACN",
      lines: [],
      error: "Failed to validate CURP with Logistica ACN",
    };
  }

  const validationData = await validationResponse.json();

  if (validationData.length > 0) {
    const lines: string[] = (
      validationData as { marca?: string; dn?: string }[]
    )
      .filter((e) => e.dn)
      .map((e) => `${e.marca ?? "Logistica ACN"}: ******${e.dn?.slice(-4)}`);

    return {
      company: "Logistica ACN",
      possibleProviders: possibleProviders,
      lines,
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  return {
    company: "Logistica ACN",
    possibleProviders: possibleProviders,
    lines: [],
    isRegistered: false,
  };
}
