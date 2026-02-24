/**
 * In-memory rate limiter for GPT API. Key by user identifier (e.g. email).
 * For multi-instance deployments, use Redis or Vercel KV instead.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

const store = new Map<string, { count: number; resetAt: number }>();

function prune(): void {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  if (store.size > 1000) prune();

  let entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count <= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterMs: Math.max(0, entry.resetAt - now),
  };
}
