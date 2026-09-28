import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInBeneleit(curp: string): Promise<LineResult> {
  const validationResponse = await fetch(
    `https://core.beneleit.talentonet.com/api/core/consulta_lineas_vinculacion?curp=${curp}`,
    { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
  );

  if (validationResponse.status === 404) {
    return {
      company: "Beneleit Móvil",
      lines: [],
      isRegistered: false,
    };
  }

  if (!validationResponse.ok) {
    const errorBody = await validationResponse
      .text()
      .catch(() => "(unreadable)");
    console.error(
      `Failed to validate CURP with Beneleit: ${validationResponse.status} ${validationResponse.statusText} — body: ${errorBody}`,
    );

    return {
      company: "Beneleit Móvil",
      lines: [],
      error: "Failed to validate CURP with Beneleit",
    };
  }

  const positiveData = await validationResponse.json().catch(() => null);

  // A 200/ok response only means registered if `data` is actually a non-empty
  // array of lines. Requiring this positive evidence (instead of trusting any
  // non-404 status) avoids silently reporting a registration if the API ever
  // returns 200 with an empty or unrecognized body.
  if (Array.isArray(positiveData?.data) && positiveData.data.length > 0) {
    console.log(
      "[beneleit] registered response:",
      JSON.stringify(stripCURPs(positiveData), null, 2),
    );
    return {
      company: "Beneleit Móvil",
      lines: [],
      isRegistered: true,
      rawApiResponse: positiveData,
    };
  }

  console.error(
    "[beneleit] unrecognized response shape, refusing to guess:",
    JSON.stringify(stripCURPs(positiveData), null, 2),
  );
  return {
    company: "Beneleit Móvil",
    lines: [],
    error: "Unrecognized response shape from Beneleit",
  };
}
