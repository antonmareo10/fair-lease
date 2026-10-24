import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import type { SampleFile } from "@/lib/extraction";
import traps from "@/samples/traps-2025.json";

/**
 * Expected results from demo_contracts/GOLD.md (hand-made before the build).
 * Each row: clause_ref, rule id, verdict.
 */
const TODAY = "2026-10-24";

function verdictsByClause(sample: SampleFile) {
  const r = analyze(sample.text, sample.extraction, { today: TODAY });
  const rows = r.findings
    .filter((f) => f.verdict !== "INFO")
    .map((f) => `${f.clauseIndices.map((i) => sample.extraction.clauses[i].clause_ref).join("+")} ${f.ruleId} ${f.verdict}`);
  return { r, rows };
}

describe("GOLD · 01 traps 2025 (regime B)", () => {
  const sample = traps as SampleFile;
  const { r, rows } = verdictsByClause(sample);

  it("finds every quote literally in the contract", () => {
    expect(r.hiddenCount).toBe(0);
  });

  it("uses the May 2023 rules", () => {
    expect(r.law.regime).toBe("B");
    expect(r.law.sentence).toBe("Signed 1 Sept 2025 → the May 2023 rules apply");
  });

  it("gives 10 not enforceable · 2 worth checking · 6 fine", () => {
    expect(r.counts).toMatchObject({ ILLEGAL: 10, CHECK: 2, OK: 6 });
  });

  it("matches GOLD clause by clause", () => {
    expect(rows.sort()).toEqual(
      [
        "SEGUNDA FL-05 ILLEGAL",
        "TERCERA FL-04 ILLEGAL",
        "TERCERA FL-15 OK",
        "CUARTA FL-08 ILLEGAL",
        "QUINTA FL-01 CHECK",
        "QUINTA FL-02 ILLEGAL",
        "QUINTA FL-16 CHECK",
        "SEXTA FL-03 ILLEGAL",
        "SÉPTIMA FL-09 ILLEGAL",
        "SÉPTIMA OK-UTILITIES OK",
        "OCTAVA FL-11 ILLEGAL",
        "NOVENA FL-07 OK",
        "NOVENA FL-07 ILLEGAL",
        "DÉCIMA FL-13 ILLEGAL",
        "UNDÉCIMA FL-14 ILLEGAL",
        "DUODÉCIMA OK-PETS OK",
        "DECIMOTERCERA OK-SUBLET OK",
        "DECIMOCUARTA FL-18 OK",
      ].sort(),
    );
  });

  it("computes the GOLD numbers", () => {
    const num = (rule: string, verdict = "ILLEGAL") => r.findings.find((f) => f.ruleId === rule && f.verdict === verdict)?.number;
    expect(num("FL-02")).toBe("5 months of guarantees · €3,450 over the limit");
    expect(num("FL-04")).toBe("2 months too many · €2,300");
    expect(num("FL-03")).toBe("€1,391.50 charged to you");
    expect(num("FL-07")).toBe("Leaving at month 6: asks €9,200 · legal maximum €575");
    expect(num("FL-05")).toBe("You can stay until 31 Aug 2030");
  });

  it("adds the DF 6ª 2% note for the 1 Sep 2027 update", () => {
    const info = r.findings.filter((f) => f.verdict === "INFO");
    expect(info.map((f) => f.title)).toContain("2% cap on your next rent update");
  });
});
