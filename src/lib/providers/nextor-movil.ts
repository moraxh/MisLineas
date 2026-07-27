import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPINNextorMovil(
  curp: string,
): Promise<LineResult> {
  const authResponse = await fetch(
    "https://vinculacion.nextormovil.mx/api/consulta/iniciar",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
    },
  );

  if (!authResponse.ok) {
    const errorData = await authResponse.json();

    if (errorData.code === "IP_RATE_LIMIT") {
      console.warn(
        "Nextor Movil rate limit hit. Returning rate limit error.",
        errorData,
      );
      return {
        company: "Nextor Movil",
        lines: [],
        error: "Nextor Movil rate limit exceeded. Please try again later.",
      };
    }

    return {
      company: "Nextor Movil",
      lines: [],
      error: "Failed to initiate session with Nextor Movil",
    };
  }

  const authData = await authResponse.json();
  const sessionId = authData.sessionId;

  const validationBody = {
    tipo: "curp",
    valor: curp,
  };

  const validationHeaders = {
    "X-Session-Id": sessionId,
    "Content-Type": "application/json",
  };

  const validationResponse = await fetch(
    "https://vinculacion.nextormovil.mx/api/consulta/pre-check",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: validationHeaders,
      body: JSON.stringify(validationBody),
    },
  );

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Nextor Movil: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Nextor Movil",
      lines: [],
      error: "Failed to validate CURP with Nextor Movil",
    };
  }

  const validationData = await validationResponse.json();

  if (validationData.encontrado) {
    console.log(
      "[nextor-movil] registered response:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "Nextor Movil",
      lines: [],
      isRegistered: true,
      rawApiResponse: validationData,
    };
  }

  return {
    company: "Nextor Movil",
    lines: [],
    isRegistered: false,
  };
}
