// Local lookup requests require a loopback browser origin. Production requires Turnstile.
export function isLocalLookup(req: Request): boolean {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.LOCAL_LOOKUP_ENABLED !== "true"
  )
    return false;
  const url = new URL(req.url);
  const allowedHosts = ["127.0.0.1", "localhost", "[::1]"];
  // Next uses the server bind address in req.url, including 0.0.0.0 for LAN previews.
  // The browser origin and Host must still match a loopback address.
  try {
    const origin = new URL(req.headers.get("origin") ?? "");
    return (
      (allowedHosts.includes(url.hostname) || url.hostname === "0.0.0.0") &&
      allowedHosts.includes(origin.hostname) &&
      origin.host === req.headers.get("host") &&
      origin.protocol === url.protocol &&
      origin.port === url.port &&
      req.headers.get("sec-fetch-site") === "same-origin"
    );
  } catch {
    return false;
  }
}
