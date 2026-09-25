/**
 * Fixed-window in-memory rate limiter. Suitable for a single instance / development.
 * For multi-instance production deployments, back this with Redis/Upstash (see docs/DEPLOYMENT.md).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** RATE_LIMIT_MULTIPLIER scales every limit (default 1). Useful for load/E2E testing; keep 1 in production. */
const MULTIPLIER = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);

export function rateLimit(key: string, baseLimit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const limit = baseLimit * MULTIPLIER;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfterMs: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfterMs: b.resetAt - now };
  b.count++;
  return { ok: true, retryAfterMs: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}
