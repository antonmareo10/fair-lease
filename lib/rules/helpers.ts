import type { Clause, Signal, Topic } from "@/lib/extraction";
import type { Finding, IndexedClause, RuleContext, Verdict } from "./types";

export function ofTopic(ctx: RuleContext, ...topics: Topic[]): IndexedClause[] {
  return ctx.clauses.filter(({ clause }) => topics.includes(clause.topic));
}

export function has(clause: Clause, ...signals: Signal[]): boolean {
  return signals.some((s) => clause.signals.includes(s));
}

/** €1,391.50 · €4,600 */
export function eur(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const fraction = Math.abs(rounded % 1) > 0.001;
  return `€${rounded.toLocaleString("en-GB", { minimumFractionDigits: fraction ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function months(n: number): string {
  const r = Math.round(n * 100) / 100;
  return `${r.toLocaleString("en-GB")} ${r === 1 ? "month" : "months"}`;
}

/** A clause's size in months of rent, from its months or its euro amount. */
export function rentMonthsOf(clause: Clause, rent: number | null): number | null {
  if (clause.numbers.months != null) return clause.numbers.months;
  if (clause.numbers.amount_eur != null && rent) return clause.numbers.amount_eur / rent;
  return null;
}

export function amountOf(clause: Clause, rent: number | null): number | null {
  if (clause.numbers.amount_eur != null) return clause.numbers.amount_eur;
  if (clause.numbers.months != null && rent) return clause.numbers.months * rent;
  return null;
}

export function finding(
  ruleId: string,
  verdict: Verdict,
  clauseIndices: number[],
  rest: Omit<Finding, "id" | "ruleId" | "verdict" | "clauseIndices">,
): Finding {
  return { id: `${ruleId}:${verdict}:${clauseIndices.join(",") || "contract"}`, ruleId, verdict, clauseIndices, ...rest };
}

export const isCompany = (ctx: RuleContext) => ctx.facts.landlord_type === "legal_person";
export const minYears = (ctx: RuleContext) => (isCompany(ctx) ? 7 : 5);
export const isC = (ctx: RuleContext) => ctx.law.regime === "C";
export const isAorB = (ctx: RuleContext) => ctx.law.regime === "A" || ctx.law.regime === "B";
export const isSeasonal = (ctx: RuleContext) => ctx.facts.contract_kind === "temporada" || ctx.facts.contract_kind === "temporal";
