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

/** Paragraphs longer than this mean the text has no blank lines between clauses; then the quote's own lines are used. */
const MAX_PARAGRAPH = 2500;

/** The paragraph of the contract that holds a verified quote: what a rule may read around the quote, never beyond it. */
export function paragraphAround(text: string, span: Span): string {
  const before = text.slice(0, span.start);
  const after = text.slice(span.end);
  let start = 0;
  for (const m of before.matchAll(/\n[^\S\n]*\n/g)) start = m.index + m[0].length;
  const blankAfter = after.search(/\n[^\S\n]*\n/);
  const end = blankAfter >= 0 ? span.end + blankAfter : text.length;
  if (end - start <= MAX_PARAGRAPH) return text.slice(start, end).trim();
  const lineStart = before.lastIndexOf("\n") + 1;
  const lineEnd = after.indexOf("\n");
  return text.slice(lineStart, lineEnd >= 0 ? span.end + lineEnd : text.length).trim();
}

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
  if (opts.dateOverride && !facts.signing_date) {
    // Still a contract without its own date: keep the picker, and say whose date this is.
    law.assumedToday = true;
    law.picked = true;
  }
  const verified = clauses
    .map((clause, index) => ({ clause, index, span: spans[index] }))
    .filter((c): c is { clause: Clause; index: number; span: Span } => c.span !== null)
    .map(({ clause, index, span }) => ({ clause, index, context: paragraphAround(text, span) }));
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
