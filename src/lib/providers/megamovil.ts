import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import type { LineResult } from "@/types";

export async function lookupCURPInMegamovil(curp: string): Promise<LineResult> {
  const sessionResponse = await fetch(
    "https://consultavinculacion.megamovil.mx",
    { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
  );

  if (!sessionResponse.ok) {
    return {
      company: "Mega Móvil",
      lines: [],
      error: "Failed to establish session with Mega Móvil",
    };
  }

  const cookies = sessionResponse.headers.getSetCookie().join(";");

  const validationResponse = await fetch(
    `https://consultavinculacion.megamovil.mx/validaCURP?curp=${curp}`,
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { Cookie: cookies },
    },
  );

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Mega Móvil: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Mega Móvil",
      lines: [],
      error: "Failed to validate CURP with Mega Móvil",
    };
  }

  const validationData = await validationResponse.json();

  if (validationData.status === "ERROR") {
    return {
      company: "Mega Móvil",
      lines: [],
      isRegistered: false,
      rawApiResponse: validationData,
    };
  }

  if (validationData.code === "0") {
    return {
      company: "Mega Móvil",
      lines: [],
      isRegistered: false,
      rawApiResponse: validationData,
    };
  }

  // Mega Móvil's API only confirms a specific CURP+line combination — it has
  // no endpoint to list every line linked to a CURP. code !== "0" just means
  // the CURP exists and the site would ask for a phone number next, so we
  // can't determine isRegistered without one.
  return {
    company: "Mega Móvil",
    lines: [],
    error: "Mega Móvil requiere un número de línea específico para confirmar vinculación; no se puede listar por CURP.",
    rawApiResponse: validationData,
  };
}
