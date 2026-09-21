// The local UI is served on loopback only. Production always requires Turnstile.
export function isLocalLookup(req: Request): boolean {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.LOCAL_LOOKUP_ENABLED !== "true"
  )
    return false;
  const url = new URL(req.url);
  const allowedHosts = ["127.0.0.1", "localhost", "[::1]"];
  // Next may normalize the request URL to localhost while the browser uses 127.0.0.1.
  try {
    const origin = new URL(req.headers.get("origin") ?? "");
    return (
      allowedHosts.includes(url.hostname) &&
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
