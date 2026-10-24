import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import { computeMoney } from "@/lib/money";
import { buildGroups } from "@/lib/groups";
import type { SampleFile } from "@/lib/extraction";
import { traps } from "./fixtures";

const sample = traps as SampleFile;
const result = analyze(sample.text, sample.extraction, { today: "2026-10-24" });

describe("Money Calculator · traps sample (GOLD.md)", () => {
  const m = computeMoney(result)!;
  it("ties up €11,741.50: €7,141.50 cash plus a €4,600 bank guarantee", () => {
    expect(m.cash).toBeCloseTo(7141.5, 2);
    expect(m.guarantees).toBe(4600);
    expect(m.committed).toBeCloseTo(11741.5, 2);
    expect(m.guaranteeKind).toBe("bank guarantee");
  });
  it("legal maximum €4,600, so €7,141.50 over", () => {
    expect(m.legalMax).toBe(4600);
    expect(m.over).toBeCloseTo(7141.5, 2);
  });
});

describe("Finding groups", () => {
  const groups = buildGroups(result.findings, result.clauses, result.spans);
  it("stacks clause QUINTA's three findings, not enforceable first", () => {
    const q = groups.find((g) => g.clauseRef === "QUINTA")!;
    expect(q.findings.map((f) => `${f.ruleId} ${f.verdict}`)).toEqual(["FL-02 ILLEGAL", "FL-01 CHECK", "FL-16 CHECK"]);
    expect(q.top).toBe("ILLEGAL");
  });
  it("keeps reading order", () => {
    const refs = groups.map((g) => g.clauseRef);
    expect(refs.indexOf("SEGUNDA")).toBeLessThan(refs.indexOf("QUINTA"));
    expect(refs.at(-1)).toBe("DECIMOCUARTA");
  });
});
