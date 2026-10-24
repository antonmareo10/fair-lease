import type { Clause, ContractFacts, Extraction } from "@/lib/extraction";
import { isoToday, resolveLaw, type LawVersion } from "@/lib/law";
import { verifyQuotes, type Span } from "@/lib/quotes";
import { RULE_COUNT, runRules } from "@/lib/rules";
import type { Finding, Verdict } from "@/lib/rules/types";

export type AnalysisResult = {
  law: LawVersion;
  facts: ContractFacts;
  clauses: Clause[];
  spans: (Span | null)[];
  hiddenCount: number;
  findings: Finding[];
  counts: Record<Verdict, number>;
  notInMadrid: boolean;
  ruleCount: number;
};

export type AnalyzeOptions = {
  today?: string;
  /** Date chosen by the tenant when the contract has no signing date. */
  dateOverride?: string | null;
};

/**
 * The deterministic half of Fair Lease: verify quotes → pick the law version →
 * run the hand-checked rules. Same code for samples and live checks; no AI here.
 */
export function analyze(text: string, extraction: Extraction, opts: AnalyzeOptions = {}): AnalysisResult {
  const { facts, clauses } = extraction;
  const { spans, hiddenCount } = verifyQuotes(
    text,
    clauses.map((c) => c.quote),
  );
  const today = opts.today ?? isoToday();
  const law = resolveLaw(opts.dateOverride ?? facts.signing_date, today);
  if (opts.dateOverride && !facts.signing_date) law.assumedToday = true; // still a contract without its own date
  const verified = clauses.map((clause, index) => ({ clause, index })).filter(({ index }) => spans[index] !== null);
  const findings = runRules({ law, facts, clauses: verified });
  const counts: Record<Verdict, number> = { ILLEGAL: 0, CHECK: 0, INFO: 0, OK: 0 };
  for (const f of findings) counts[f.verdict] += 1;
  const city = (facts.city ?? "").trim().toLowerCase();
  return {
    law,
    facts,
    clauses,
    spans,
    hiddenCount,
    findings,
    counts,
    notInMadrid: city !== "" && !city.includes("madrid"),
    ruleCount: RULE_COUNT,
  };
}
