import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import type { LineResult } from "@/types";

export async function lookupCURPInSorcel(curp: string): Promise<LineResult> {
  const vallidationFormData = new FormData();
  vallidationFormData.append("curpa", curp);

  const validationResponse = await fetch(
    "https://www.soriup.mx/consultaR.asp",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      body: vallidationFormData,
    },
  );

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Sorcel: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Sorcel",
      lines: [],
      error: "Failed to validate CURP with Sorcel",
    };
  }

  // Sorcel returns an HTML page, so we need to parse it to determine if the CURP is registered
  const validationText = await validationResponse.text();

  if (validationText.includes("No hay registros para esa RFC/CURP")) {
    return {
      company: "Sorcel",
      lines: [],
      isRegistered: false,
    };
  }

  console.log("[sorcel] registered response (HTML text):", validationText);
  return {
    company: "Sorcel",
    lines: [],
    isRegistered: true,
    rawApiResponse: {
      responseType: "html",
      snippet: validationText.slice(0, 500),
    },
  };
}
