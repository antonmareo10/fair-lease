import type { Finding, Rule, RuleContext } from "./types";
import { SEVERITY } from "./types";
import { fl01 } from "./fl01-deposit";
import { fl02 } from "./fl02-extra-guarantees";
import { fl03 } from "./fl03-agency-fees";
import { fl04 } from "./fl04-prepayment";
import { fl05 } from "./fl05-renewals";
import { fl06 } from "./fl06-landlord-termination";
import { fl07 } from "./fl07-early-exit";
import { fl08 } from "./fl08-rent-update";
import { fl09 } from "./fl09-community-fees";
import { fl10 } from "./fl10-taxes";
import { fl11 } from "./fl11-repairs";
import { fl12 } from "./fl12-sale";
import { fl13 } from "./fl13-landlord-entry";
import { fl14 } from "./fl14-padron";
import { fl15 } from "./fl15-payment-method";
import { fl16 } from "./fl16-deposit-return";
import { fl17 } from "./fl17-default-insurance";
import { fl18 } from "./fl18-purchase-right";
import { fl19 } from "./fl19-seasonal";
import { fl20 } from "./fl20-late-handover";
import { fl21 } from "./fl21-negotiated";
import { fl22 } from "./fl22-legal-costs";
import { knownLegal } from "./known-legal";

/**
 * The hand-checked FL rules in this build, FL-01 to FL-22 (LEGAL_RULES.md §3). FL-12, 20, 21 and 22 were deferred
 * from the proof of concept and added after the held-out evaluation found the clauses they cover.
 */
export const FL_RULES: Rule[] = [fl01, fl02, fl03, fl04, fl05, fl06, fl07, fl08, fl09, fl10, fl11, fl12, fl13, fl14, fl15, fl16, fl17, fl18, fl19, fl20, fl21, fl22];

export const RULE_COUNT = FL_RULES.length;

/**
 * One finding per rule, verdict and contract clause: if the extraction split a clause
 * into several quotes (e.g. two sentences of SEGUNDA), they count once, with both highlighted.
 */
function mergeSameClause(findings: Finding[], ctx: RuleContext): Finding[] {
  const refOf = new Map(ctx.clauses.map(({ clause, index }) => [index, clause.clause_ref]));
  const merged = new Map<string, Finding>();
  for (const f of findings) {
    const refs = [...new Set(f.clauseIndices.map((i) => refOf.get(i)))].sort().join("+") || `contract:${f.id}`;
    const key = `${f.ruleId}|${f.verdict}|${refs}`;
    const prev = merged.get(key);
    if (!prev) merged.set(key, f);
    else prev.clauseIndices = [...new Set([...prev.clauseIndices, ...f.clauseIndices])];
  }
  return [...merged.values()];
}

export function runRules(ctx: RuleContext): Finding[] {
  if (ctx.law.regime === "pre2019") return [];
  const findings = mergeSameClause(
    [...FL_RULES, knownLegal].flatMap((rule) => rule.evaluate(ctx)),
    ctx,
  );
  const firstClause = (f: Finding) => (f.clauseIndices.length ? Math.min(...f.clauseIndices) : Number.MAX_SAFE_INTEGER);
  // Reading order, then severity within the same clause.
  return findings.sort((a, b) => firstClause(a) - firstClause(b) || SEVERITY[b.verdict] - SEVERITY[a.verdict]);
}
