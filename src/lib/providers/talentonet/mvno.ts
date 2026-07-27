import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getResidentialProxyUrl } from "@/lib/proxy";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

const possibleProviders = ["Newww", "RedAguila", "Link Movil"];

export async function loookupCURPInTalentoNetMVNO(
  curp: string,
): Promise<LineResult> {
  const proxyUrl = getResidentialProxyUrl();
  const validationResponse = await undiciFetch(
    `https://core.newww.mx/api/core/consulta_lineas_vinculacion?curp=${curp}`,
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      dispatcher: proxyUrl ? new ProxyAgent(proxyUrl) : undefined,
    },
  );

  if (validationResponse.status === 404) {
    const errorData = (await validationResponse.json()) as { msg?: string };

    if (errorData.msg === "No se encontraron registros para esta CURP.") {
      return {
        company: "Newww",
        lines: [],
        possibleProviders,
        isRegistered: false,
      };
    }
  }

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Newww: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Newww",
      lines: [],
      possibleProviders,
      error: "Failed to validate CURP with Newww",
    };
  }

  const positiveData = await validationResponse.json().catch(() => null);
  console.log(
    "[talentonet] registered response:",
    JSON.stringify(stripCURPs(positiveData), null, 2),
  );
  return {
    company: "Newww",
    lines: [],
    possibleProviders: possibleProviders,
    isRegistered: true,
    rawApiResponse: positiveData,
  };
}
