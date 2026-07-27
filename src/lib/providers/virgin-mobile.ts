import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import type { LineResult } from "@/types";

export async function loookupCURPInVirginMobile(
  curp: string,
): Promise<LineResult> {
  const validationBody = {
    tipo_documento: "CURP",
    id_documento: curp,
  };

  const validationResponse = await fetch(
    "https://www.virginmobile.mx/api/v1/public/consulta-linea/findMsisdn",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validationBody),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Virgin Mobile:",
      validationResponse.statusText,
    );

    return {
      company: "Virgin Mobile",
      lines: [],
      error: "Failed to validate CURP with Virgin Mobile",
    };
  }

  const validationData = await validationResponse.json();

  if (validationData.data.total_lineas === 0) {
    return {
      company: "Virgin Mobile",
      lines: [],
      isRegistered: false,
    };
  }

  return {
    company: "Virgin Mobile",
    lines: validationData.data?.lineas || [],
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
