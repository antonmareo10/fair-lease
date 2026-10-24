import type { AnalysisResult } from "@/lib/analyze";
import type { Extraction } from "@/lib/extraction";

/** $ per million tokens (input, output), from the claude-api reference cached 6 Oct 2026. */
export const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};

export function costOf(model: string, usage?: { input_tokens: number; output_tokens: number }): number {
  const p = PRICES[model] ?? PRICES["claude-opus-5-5"];
  if (!usage) return 0;
  return (usage.input_tokens * p[0] + usage.output_tokens * p[1]) / 1e6;
}

/** "QUINTA FL-02 ILLEGAL"-style rows, ignoring "Your right" notes. */
export function rows(r: AnalysisResult, e: Extraction): string[] {
  return r.findings
    .filter((f) => f.verdict !== "INFO")
    .map((f) => `${f.clauseIndices.map((i) => e.clauses[i].clause_ref).join("+") || "contract"} ${f.ruleId} ${f.verdict}`)
    .sort();
}
