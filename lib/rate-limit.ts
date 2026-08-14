type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Lightweight per-instance protection. Add an edge/WAF rule before high traffic. */
export function isRateLimited(key: string, max = 6, windowMs = 60_000) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  existing.count += 1;
  return existing.count > max;
}
