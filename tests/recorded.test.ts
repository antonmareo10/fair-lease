import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import { anonymize } from "@/lib/anonymize";
import { computeMoney } from "@/lib/money";
import type { SampleFile } from "@/lib/extraction";
import { fair, reform, shipped, traps } from "./fixtures";

/**
 * The shipped samples carry Claude's recorded extraction. Claude may quote more "fine"
 * clauses than the hand-made fixture, but every quote must be literally in the text and
 * the not-enforceable / worth-checking verdicts must match GOLD.md exactly.
 */
const TODAY = "2026-10-24";
const verdicts = (s: SampleFile) => {
  const text = anonymize(s.text).text;
  const r = analyze(text, s.extraction, { today: TODAY });
  const serious = r.findings
    .filter((f) => f.verdict === "ILLEGAL" || f.verdict === "CHECK")
    .map((f) => `${s.extraction.clauses[f.clauseIndices[0]]?.clause_ref ?? "contract"} ${f.ruleId} ${f.verdict}`)
    .sort();
  return { r, serious };
};

describe.each([
  ["traps", shipped.traps, traps],
  ["fair", shipped.fair, fair],
  ["reform", shipped.reform, reform],
] as const)("recorded sample · %s", (_, recorded, expected) => {
  const got = verdicts(recorded);
  const want = verdicts(expected);
  it("is labelled as a recorded extraction", () => expect(recorded.provenance.kind).toBe("recorded"));
  it("has every quote literally in the contract", () => expect(got.r.hiddenCount).toBe(0));
  it("gives the GOLD not-enforceable and worth-checking verdicts", () => expect(got.serious).toEqual(want.serious));
});

describe("recorded traps sample keeps the headline numbers", () => {
  const { r } = verdicts(shipped.traps);
  it("10 not enforceable · 2 worth checking · 6 fine", () => expect(r.counts).toMatchObject({ ILLEGAL: 10, CHECK: 2, OK: 6 }));
  it("€11,741.50 committed, €4,600 legal maximum", () => {
    const m = computeMoney(r)!;
    expect(m.committed).toBeCloseTo(11741.5, 2);
    expect(m.legalMax).toBe(4600);
  });
});
