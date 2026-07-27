import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInDialo(curp: string): Promise<LineResult> {
  const validationBody = {
    operation: "count",
    data: {
      tipo_info_personal: curp,
    },
  };

  const validationHeaders = {
    "Content-Type": "application/json",
    Origin: "https://dialo.mx",
    Referer: "https://dialo.mx",
  };

  const validationResponse = await fetch(
    "https://p737drx1pj.execute-api.us-east-1.amazonaws.com/prod/gestion-lineas",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: validationHeaders,
      body: JSON.stringify(validationBody),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Dialo:",
      validationResponse.statusText,
    );

    return {
      company: "Dialo",
      lines: [],
      error: "Failed to validate CURP with Dialo",
    };
  }

  const validationData = await validationResponse.json() as { statusCode?: number; body?: string | { data?: { total: number }[] } };

  const body = typeof validationData.body === "string"
    ? JSON.parse(validationData.body) as { data?: { total: number }[]; message?: string; error?: string }
    : validationData.body;

  if (!body || !Array.isArray(body.data) || body.data.length === 0) {
    console.error("[dialo] Unexpected response structure:", JSON.stringify(stripCURPs(validationData), null, 2));
    return {
      company: "Dialo",
      lines: [],
      error: "Unexpected response from Dialo",
    };
  }

  if (body.data[0].total > 0) {
    console.log(
      "[dialo] registered response:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "Dialo",
      lines: [],
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  return {
    company: "Dialo",
    lines: [],
    isRegistered: false,
  };
}
