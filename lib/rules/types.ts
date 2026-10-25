import type { Clause, ContractFacts } from "@/lib/extraction";
import type { LawVersion } from "@/lib/law";

export type Verdict = "ILLEGAL" | "CHECK" | "INFO" | "OK";

/** Severity order used for colours, stacking and counts. */
export const SEVERITY: Record<Verdict, number> = { ILLEGAL: 3, CHECK: 2, INFO: 1, OK: 0 };

export const VERDICT_LABEL: Record<Verdict, string> = {
  ILLEGAL: "Not enforceable",
  CHECK: "Worth checking",
  INFO: "Your right",
  OK: "Fine",
};

export type LawText = {
  article: string; // e.g. "LAU art. 36.5"
  boeUrl: string;
  quoteEs?: string; // literal text from the BOE consolidated version
  quoteEn?: string; // unofficial English translation
};

export type Finding = {
  id: string;
  ruleId: string;
  verdict: Verdict;
  clauseIndices: number[]; // indices into extraction.clauses; empty = about the whole contract
  title: string;
  body: string;
  number?: string;
  law: LawText;
  askInstead?: { en: string; es: string };
  newSinceOct2026?: boolean;
};

export type IndexedClause = {
  clause: Clause;
  index: number;
  /** The contract paragraph the verified quote sits in (the quote itself when unknown). Read only from the contract. */
  context?: string;
};

export type RuleContext = {
  law: LawVersion;
  facts: ContractFacts;
  /** Only clauses whose quote was found literally in the contract. */
  clauses: IndexedClause[];
};

export type Rule = {
  id: string;
  name: string;
  evaluate(ctx: RuleContext): Finding[];
};
