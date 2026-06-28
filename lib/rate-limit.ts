import "server-only";

/**
 * A minimal in-memory rate limiter, keyed by an arbitrary string (usually
 * IP + action name). This is a defense-in-depth layer alongside
 * Supabase Auth's own built-in rate limits — it is NOT a substitute for
 * them and is intentionally simple.
 *
 * Caveat: in-memory state doesn't survive serverless cold starts and
 * isn't shared across multiple instances. For production-grade rate
 * limiting at scale, replace this with a durable store (e.g. Upstash
 * Redis) — this implementation is sized for a small-to-medium deployment
 * and to make local development not require extra infrastructure.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically clear stale entries so the map doesn't grow unbounded in a
// long-lived process.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of attempts) {
      if (entry.resetAt < now) attempts.delete(key);
    }
  }, 60_000).unref?.();
}
