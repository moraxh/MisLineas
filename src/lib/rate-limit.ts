import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

// Serverless functions don't share process memory across instances/cold
// starts, so the limit needs a store every instance can see. Upstash Redis
// (Vercel Marketplace integration) provides that; UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set automatically when the integration is
// linked to the project.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// In-memory fallback: used for local dev (no Redis configured) and as a
// last resort if Redis is briefly unreachable. Not shared across instances,
// so it's "best effort" only, never the primary guard in production.
const memoryStore = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt < now) memoryStore.delete(key);
  }
}, 5 * 60_000).unref();

function checkRateLimitInMemory(ip: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = memoryStore.get(ip);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return checkRateLimitInMemory(ip);

  const key = `ratelimit:lookup:${ip}`;

  try {
    // INCR + first-hit EXPIRE is the standard fixed-window pattern: atomic
    // per call, and the window only resets when the key doesn't exist yet
    // (ttl === -1 right after the INCR that created it).
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, WINDOW_MS);
    }

    if (count > MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: MAX_REQUESTS - count };
  } catch (err) {
    // Redis unreachable: fail open to the in-memory fallback rather than
    // blocking every request. Best-effort protection beats none.
    console.warn("Rate limit check failed, falling back to in-memory:", err);
    return checkRateLimitInMemory(ip);
  }
}
