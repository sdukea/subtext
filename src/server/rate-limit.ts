/**
 * Minimal fixed-window rate limiter (per process). Sufficient for local/single-instance use;
 * replace with a shared store (KV/Postgres) before multi-instance deployment (research/08 §12).
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = Number.parseInt(process.env.SUBTEXT_RATE_LIMIT ?? "40", 10);
const hits = new Map<string, { start: number; count: number }>();

export function rateLimit(key: string, now = Date.now()): boolean {
  const h = hits.get(key);
  if (!h || now - h.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    if (hits.size > 10_000) for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k);
    return true;
  }
  h.count++;
  return h.count <= MAX_PER_WINDOW;
}
