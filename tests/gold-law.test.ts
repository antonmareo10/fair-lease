import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import { resolveLaw, regimeFor } from "@/lib/law";
import type { SampleFile } from "@/lib/extraction";
import fair from "@/samples/fair-2024.json";
import reform from "@/samples/reform-oct-2026.json";
import traps from "@/samples/traps-2025.json";

const TODAY = "2026-10-24";
const run = (s: unknown, opts = {}) => {
  const sample = s as SampleFile;
  const r = analyze(sample.text, sample.extraction, { today: TODAY, ...opts });
  const rows = r.findings.map((f) => `${f.clauseIndices.map((i) => sample.extraction.clauses[i].clause_ref).join("+") || "contract"} ${f.ruleId} ${f.verdict}`);
  return { r, rows };
};

describe("GOLD · 02 fair 2024 (no false positives)", () => {
  const { r, rows } = run(fair);
  it("finds every quote", () => expect(r.hiddenCount).toBe(0));
  it("has nothing not enforceable and nothing worth checking", () => {
    expect(r.counts.ILLEGAL).toBe(0);
    expect(r.counts.CHECK).toBe(0);
  });
  it("marks the GOLD rows as fine", () => {
    for (const row of [
      "SEGUNDA FL-05 OK",
      "TERCERA FL-06 OK",
      "CUARTA FL-04 OK",
      "QUINTA FL-08 OK",
      "SEXTA FL-01 OK",
      "SEXTA FL-02 OK",
      "SÉPTIMA FL-09 OK",
      "SÉPTIMA FL-03 OK",
      "OCTAVA FL-11 OK",
      "NOVENA FL-07 OK",
      "DÉCIMA FL-13 OK",
      "UNDÉCIMA OK-PETS OK",
      "DUODÉCIMA OK-SUBLET OK",
      "DECIMOTERCERA OK-WORKS OK",
      "DECIMOCUARTA FL-16 OK",
    ])
      expect(rows).toContain(row);
  });
  it("adds the DF 6ª note: the 15 Feb 2027 update is capped at 2%", () => {
    const info = r.findings.find((f) => f.verdict === "INFO")!;
    expect(info.body).toContain("15 Feb 2027");
    expect(rows).toContain("QUINTA FL-08 INFO");
  });
});

describe("GOLD · 03 reform Oct 2026 (regime C, pending vote)", () => {
  const { r, rows } = run(reform);
  it("finds every quote", () => expect(r.hiddenCount).toBe(0));
  it("applies the 8 Oct 2026 reform", () => {
    expect(r.law.regime).toBe("C");
    expect(r.law.pendingVote).toBe(true);
  });
  it("flags exactly FL-19, 17, 10, 07, 18 as not enforceable, all tagged new", () => {
    const illegal = r.findings.filter((f) => f.verdict === "ILLEGAL");
    expect(illegal.map((f) => f.ruleId).sort()).toEqual(["FL-07", "FL-10", "FL-17", "FL-18", "FL-19"]);
    expect(illegal.every((f) => f.newSinceOct2026)).toBe(true);
  });
  it("FL-19 rests on the title, clause 1, the renewals and clause 10", () => {
    expect(rows).toContain("TÍTULO+PRIMERA+SEGUNDA+DÉCIMA FL-19 ILLEGAL");
  });
  it("keeps the deposit and guarantee fine, and notes the rent can't go up", () => {
    expect(rows).toContain("CUARTA FL-02 OK");
    expect(rows).toContain("SEXTA FL-09 OK");
    expect(rows).toContain("contract FL-08 INFO");
  });
});

describe("The law knows the date", () => {
  it("same waiver of the right to buy: fine in 2025, not enforceable in Oct 2026", () => {
    expect(run(traps).rows).toContain("DECIMOCUARTA FL-18 OK");
    expect(run(reform).rows).toContain("OCTAVA FL-18 ILLEGAL");
  });
  it("same one-month-per-year exit compensation: fine in 2024, not enforceable in Oct 2026", () => {
    expect(run(fair).rows).toContain("NOVENA FL-07 OK");
    expect(run(reform).rows).toContain("SÉPTIMA FL-07 ILLEGAL");
  });
});

describe("Law Version Resolver edges", () => {
  it.each([
    ["2019-03-05", "pre2019"],
    ["2019-03-06", "A"],
    ["2023-05-25", "A"],
    ["2023-05-26", "B"],
    ["2026-10-07", "B"],
    ["2026-10-08", "C"],
  ])("%s → %s", (date, regime) => expect(regimeFor(date)).toBe(regime));

  it("flags the 1-2 Oct 2026 window", () => {
    expect(resolveLaw("2026-10-01", TODAY).window1to2Oct2026).toBe(true);
    expect(resolveLaw("2026-10-02", TODAY).window1to2Oct2026).toBe(true);
    expect(resolveLaw("2026-10-03", TODAY).window1to2Oct2026).toBe(false);
  });

  it("uses today when there's no date, and says so", () => {
    const law = resolveLaw(null, TODAY);
    expect(law.assumedToday).toBe(true);
    expect(law.regime).toBe("C");
    expect(law.sentence).toContain("No signing date");
  });

  it("re-runs the rules for a date the tenant picks, without a new extraction", () => {
    const sample = reform as SampleFile;
    const undated = { ...sample.extraction, facts: { ...sample.extraction.facts, signing_date: null } };
    const asToday = analyze(sample.text, undated, { today: TODAY });
    const picked = analyze(sample.text, undated, { today: TODAY, dateOverride: "2025-03-01" });
    expect(asToday.law.regime).toBe("C");
    expect(picked.law.regime).toBe("B");
    expect(picked.law.assumedToday).toBe(true);
    expect(asToday.findings.find((f) => f.ruleId === "FL-18")!.verdict).toBe("ILLEGAL");
    expect(picked.findings.find((f) => f.ruleId === "FL-18")!.verdict).toBe("OK");
  });

  it("checks nothing before March 2019", () => {
    const sample = traps as SampleFile;
    const old = { ...sample.extraction, facts: { ...sample.extraction.facts, signing_date: "2018-06-01" } };
    expect(analyze(sample.text, old, { today: TODAY }).findings).toHaveLength(0);
  });
});
