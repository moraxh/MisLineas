import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

type ViasatLink = {
  DN?: string;
  linkStatus?: string;
};

type ViasatResponse = {
  result?: string;
  data?: { list?: ViasatLink[] | null };
};

const STATUS_SUFFIX: Record<string, string> = {
  IN_PROCESS: " (en proceso de validación)",
  REQUESTED: " (en proceso de validación)",
};

export async function lookupCURPInViasat(curp: string): Promise<LineResult> {
  const validationResponse = await fetch(
    "https://viasatprepago.com.mx/services/service.php",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://viasatprepago.com.mx",
        Referer: "https://viasatprepago.com.mx/vinculatulinea/",
      },
      body: new URLSearchParams({
        RFC: "",
        CURP: curp,
        action: "checkDNLink",
      }),
    },
  );

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with Viasat:",
      validationResponse.statusText,
    );
    return {
      company: "Viasat",
      lines: [],
      error: "Failed to validate CURP with Viasat",
    };
  }

  const validationData = (await validationResponse.json()) as ViasatResponse;
  const list = validationData?.data?.list;

  // Only an explicit success with a list (possibly empty) is trusted.
  if (validationData?.result !== "success" || !Array.isArray(list)) {
    console.error(
      "[viasat] unrecognized response shape, refusing to guess:",
      JSON.stringify(stripCURPs(validationData), null, 2),
    );
    return {
      company: "Viasat",
      lines: [],
      error: "Unrecognized response from Viasat",
    };
  }

  // Rejected links are not active lines, so they are left out.
  const active = list.filter((l) => l.DN && l.linkStatus !== "REJECTED");

  if (active.length === 0) {
    return { company: "Viasat", lines: [], isRegistered: false };
  }

  return {
    company: "Viasat",
    lines: active.map(
      (l) =>
        `Viasat: ******${String(l.DN).slice(-4)}${STATUS_SUFFIX[l.linkStatus ?? ""] ?? ""}`,
    ),
    isRegistered: true,
    rawApiResponse: validationData,
  };
}
