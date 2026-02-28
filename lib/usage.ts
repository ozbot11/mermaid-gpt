/**
 * Per-user AI token usage tracking.
 * In-memory store: resets on server restart. For production, replace with
 * Vercel KV, a database, or another persistent store.
 */

export type UsageSource = "gpt" | "complete";

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface UserUsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  bySource: { gpt: number; complete: number };
  requestCount: { gpt: number; complete: number };
  lastUpdated: number;
}

const store = new Map<string, UserUsageStats>();

function getOrCreate(email: string): UserUsageStats {
  let stats = store.get(email);
  if (!stats) {
    stats = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      bySource: { gpt: 0, complete: 0 },
      requestCount: { gpt: 0, complete: 0 },
      lastUpdated: 0,
    };
    store.set(email, stats);
  }
  return stats;
}

export function recordUsage(
  userEmail: string,
  usage: TokenUsage,
  source: UsageSource
): void {
  const stats = getOrCreate(userEmail);
  stats.totalTokens += usage.total_tokens;
  stats.promptTokens += usage.prompt_tokens;
  stats.completionTokens += usage.completion_tokens;
  stats.bySource[source] += usage.total_tokens;
  stats.requestCount[source] += 1;
  stats.lastUpdated = Date.now();
}

export function getUsage(userEmail: string): UserUsageStats | null {
  const stats = store.get(userEmail);
  if (!stats) return null;
  return { ...stats };
}
