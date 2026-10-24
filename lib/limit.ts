/**
 * Daily Live Limit (spec.md > Daily Live Limit). Best effort: the counter lives in
 * the server function's memory, so separate instances count separately. The hard
 * money cap is the spend limit on the API key in the Anthropic console.
 */
export type Limiter = { take: (ip: string) => boolean; remainingToday: () => number };

export function createLimiter({ daily, perIpPerHour = 5, now = () => Date.now() }: { daily: number; perIpPerHour?: number; now?: () => number }): Limiter {
  let day = "";
  let count = 0;
  const hits = new Map<string, number[]>();
  const today = () => new Date(now()).toISOString().slice(0, 10);

  return {
    take(ip) {
      const d = today();
      if (d !== day) {
        day = d;
        count = 0;
        hits.clear();
      }
      if (count >= daily) return false;
      const hourAgo = now() - 3_600_000;
      const mine = (hits.get(ip) ?? []).filter((t) => t > hourAgo);
      if (mine.length >= perIpPerHour) return false;
      mine.push(now());
      hits.set(ip, mine);
      count += 1;
      return true;
    },
    remainingToday() {
      return today() === day ? Math.max(0, daily - count) : daily;
    },
  };
}
