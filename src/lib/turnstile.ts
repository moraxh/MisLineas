/** Verify before any provider work. Missing configuration never bypasses protection. */
export async function verifyTurnstile(
  token: unknown,
): Promise<
  { success: true } | { success: false; status: 403 | 503; error: string }
> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);
  const unavailable = {
    success: false as const,
    status: 503 as const,
    error:
      "La verificación de seguridad no está disponible. Intenta más tarde.",
  };
  const rejected = {
    success: false as const,
    status: 403 as const,
    error: "Completa de nuevo la verificación de seguridad para consultar.",
  };

  if (!secret || hostnames.length === 0) return unavailable;
  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    return rejected;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!response.ok) return unavailable;
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return unavailable;
    if (
      "success" in result &&
      result.success === true &&
      "hostname" in result &&
      typeof result.hostname === "string" &&
      hostnames.includes(result.hostname) &&
      "action" in result &&
      result.action === "lookup"
    ) {
      return { success: true };
    }
    return rejected;
  } catch {
    // Do not log tokens, the secret, or the submitted CURP.
    return unavailable;
  }
}
