type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 200;

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [ip, b] of buckets.entries()) {
    if (now >= b.resetAt && b.count === 0) {
      buckets.delete(ip);
    }
  }
}

export function checkVitalsRateLimit(
  ip: string,
  nowMs: number = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  prune(nowMs);
  const existing = buckets.get(ip);
  if (!existing || nowMs >= existing.resetAt) {
    buckets.set(ip, { count: 1, resetAt: nowMs + WINDOW_MS });
    return { ok: true };
  }
  if (existing.count >= MAX_REQUESTS) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1000)),
    };
  }
  existing.count += 1;
  return { ok: true };
}
