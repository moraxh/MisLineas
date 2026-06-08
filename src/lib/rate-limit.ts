const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

// Cleanup old entries every 5 minutes to avoid memory leak
setInterval(
    () => {
          const now = Date.now();
          for (const [key, entry] of store) {
                  if (entry.resetAt < now) store.delete(key);
          }
    },
    5 * 60_000,
  ).unref();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
        store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
    return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

/**
 * Validates an API Key from the Authorization header.
 * Keys are stored in the env variable API_KEYS as a comma-separated list.
 * Example: API_KEYS=key1,key2,key3
 */
export function validateApiKey(authHeader: string | null): boolean {
    if (!authHeader) return false;
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
          : authHeader.trim();
    if (!token) return false;
    const validKeys = (process.env.API_KEYS ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    return validKeys.includes(token);
}
