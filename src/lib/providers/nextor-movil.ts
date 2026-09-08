import { ProxyAgent, fetch as undiciFetch } from "undici";
import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { getResidentialProxyUrl } from "@/lib/proxy";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

// One agent for the whole lookup, not one per request.
//
// getResidentialProxyUrl() picks a random entry from RESIDENTIAL_PROXIES on
// every call, so resolving it separately for /iniciar and /pre-check could send
// them through two different residential IPs — the sessionId handed out to one
// IP then arrives from another. Against an endpoint whose documented problem is
// per-IP rate limiting, that is the one thing we cannot afford to get wrong.
//
// Reusing a single agent also means one TCP+TLS handshake to the proxy instead
// of two, and lets us apply the same keep-alive posture as the global
// dispatcher in instrumentation.ts — an explicit `dispatcher:` bypasses it, so
// the proxied providers were the only ones not getting that protection.
function createDispatcher(): ProxyAgent | undefined {
  const proxyUrl = getResidentialProxyUrl();
  if (!proxyUrl) return undefined;

  return new ProxyAgent({
    uri: proxyUrl,
    allowH2: false,
    keepAliveTimeout: 10_000,
    keepAliveMaxTimeout: 10_000,
  });
}

export async function lookupCURPINNextorMovil(
  curp: string,
): Promise<LineResult> {
  const dispatcher = createDispatcher();

  try {
    const authResponse = await undiciFetch(
      "https://vinculacion.nextormovil.mx/api/consulta/iniciar",
      {
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        method: "POST",
        dispatcher,
      },
    );

    if (!authResponse.ok) {
      const errorData = (await authResponse.json()) as { code?: string };

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

    const authData = (await authResponse.json()) as { sessionId?: string };
    const sessionId = authData.sessionId;

    const validationBody = {
      tipo: "curp",
      valor: curp,
    };

    const validationHeaders = {
      "X-Session-Id": sessionId,
      "Content-Type": "application/json",
    };

    const validationResponse = await undiciFetch(
      "https://vinculacion.nextormovil.mx/api/consulta/pre-check",
      {
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        method: "POST",
        headers: validationHeaders,
        body: JSON.stringify(validationBody),
        dispatcher,
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

    const validationData = (await validationResponse.json()) as {
      encontrado?: boolean;
    };

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
  } finally {
    // Without this the agent's sockets stay open until they idle out, so a
    // burst of lookups piles up proxy connections nobody is using.
    await dispatcher?.close();
  }
}
