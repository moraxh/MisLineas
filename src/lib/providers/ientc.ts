import { PROVIDER_TIMEOUT_MS } from "@/lib/data/content";
import { stripCURPs } from "@/lib/sanitize";
import type { LineResult } from "@/types";

export async function lookupCURPInIENTC(curp: string): Promise<LineResult> {
  const authFormData = new FormData();
  authFormData.append("grant_type", "client_credentials");

  const authResponse = await fetch(
    "https://api-iso-prod.ientc.dev/auth/jwt/token",
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      method: "POST",
      headers: {
        Authorization: `Basic N3U4ZThyNjF0OGwwbnRmZ3I5dmozaWhpN2U6a3FvYzNoYzIyZW9nYmVlazdyZWVzNnZqMW81cHFhMzlxcjg4aWVmZ3A3YTRudjd1aXFx`,
      },
      body: authFormData,
    },
  );

  if (!authResponse.ok) {
    console.error(
      "Failed to authenticate with IENTC:",
      authResponse.statusText,
    );

    return {
      company: "IENTC",
      lines: [],
      error: "Failed to authenticate with IENTC",
    };
  }

  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  const validationResponse = await fetch(
    `https://api-iso-prod.ientc.dev/vinculacion/number/get-phones?curp=${curp}`,
    {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (validationResponse.status === 404) {
    const validationData = await validationResponse.json();

    if (validationData.detail.code === "No hay usuarios con ese RFC o CURP") {
      return {
        company: "IENTC",
        lines: [],
        isRegistered: false,
      };
    } else {
      console.error(
        "Unexpected error validating CURP with IENTC:",
        JSON.stringify(stripCURPs(validationData), null, 2),
      );

      return {
        company: "IENTC",
        lines: [],
        error: "Unexpected error validating CURP with IENTC",
      };
    }
  }

  if (!validationResponse.ok) {
    console.error(
      "Failed to validate CURP with IENTC:",
      validationResponse.statusText,
    );

    return {
      company: "IENTC",
      lines: [],
      error: "Failed to validate CURP with IENTC",
    };
  }

  const positiveData = await validationResponse.json().catch(() => null);
  console.log(
    "[ientc] registered response:",
    JSON.stringify(stripCURPs(positiveData), null, 2),
  );
  return {
    company: "IENTC",
    lines: [],
    isRegistered: true,
    rawApiResponse: positiveData,
  };
}
