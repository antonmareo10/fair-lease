import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import type { Extraction } from "@/lib/extraction";
import { art93Evidence } from "@/lib/rules/fl06-landlord-termination";
import liveExtraction from "@/scripts/fixtures/fair-2024.sonnet-live.extraction.json";
import { fair } from "./fixtures";

const TODAY = "2026-10-24";
const live = liveExtraction as Extraction;

/** The fair 2024 contract with its TERCERA clause edited: new quote and/or signals. */
function withTercera(edit: (c: Extraction["clauses"][number]) => Extraction["clauses"][number], facts: Partial<Extraction["facts"]> = {}) {
  const ext: Extraction = {
    facts: { ...live.facts, ...facts },
    clauses: live.clauses.map((c) => (c.clause_ref === "TERCERA" ? edit(c) : c)),
  };
  const r = analyze(fair.text, ext, { today: TODAY });
  return r.findings.find((f) => f.ruleId === "FL-06");
}

describe("FL-06 · a stray landlord_can_terminate signal does not decide the rule", () => {
  const tercera = live.clauses.find((c) => c.clause_ref === "TERCERA")!;

  it("the real Sonnet extraction that caused the false alarm carries the stray signal", () => {
    expect(tercera.signals).toContain("landlord_can_terminate");
    expect(tercera.signals).toEqual(expect.arrayContaining(["need_for_landlord_or_family", "need_after_first_year", "need_notice_two_months"]));
  });

  it("reads the quote, finds the article 9.3 conditions, and keeps the clause fine", () => {
    const r = analyze(fair.text, live, { today: TODAY });
    expect(r.hiddenCount).toBe(0);
    expect(r.counts.ILLEGAL).toBe(0);
    expect(r.counts.CHECK).toBe(0);
    expect(r.findings.find((f) => f.ruleId === "FL-06")?.verdict).toBe("OK");
  });

  it("still says not enforceable when the quote shows another way out for the landlord", () => {
    const tail = "lo comunique con al menos dos meses de antelación";
    const text = fair.text.replace(tail, `${tail}, o en cualquier momento si decide vender la vivienda`);
    expect(text).not.toBe(fair.text);
    const ext: Extraction = {
      facts: live.facts,
      clauses: live.clauses.map((c) => (c.clause_ref === "TERCERA" ? { ...c, quote: `${c.quote}, o en cualquier momento si decide vender la vivienda` } : c)),
    };
    const r = analyze(text, ext, { today: TODAY });
    expect(r.hiddenCount).toBe(0);
    expect(r.findings.find((f) => f.ruleId === "FL-06")?.verdict).toBe("ILLEGAL");
  });

  it("reads the whole clause, not only the quote: a quote with half the conditions is fine when its paragraph has the rest", () => {
    // Held-out contract H2: Sonnet quoted only the sentence with the first year and the notice, and the need for the
    // landlord's mother sat in the sentence before. The paragraph is read from the contract, never from the model.
    const quote = "se hace constar expresamente que LA ARRENDADORA, persona física, podrá necesitar ocupar la vivienda antes del transcurso de cinco años para destinarla a vivienda permanente de su hija";
    const f = withTercera((c) => ({ ...c, quote }));
    expect(f?.verdict).toBe("OK");
  });

  it("goes to 'worth checking' when the clause itself does not back the signals", () => {
    // The same clause with the first-year and notice conditions taken out of the contract.
    const tail = ", siempre que haya transcurrido el primer año de contrato y lo comunique con al menos dos meses de antelación";
    const text = fair.text.replace(tail, "");
    expect(text).not.toBe(fair.text);
    const quote = "podrá necesitar ocupar la vivienda antes del transcurso de cinco años para destinarla a vivienda permanente de su hija";
    const ext: Extraction = { facts: live.facts, clauses: live.clauses.map((c) => (c.clause_ref === "TERCERA" ? { ...c, quote } : c)) };
    const r = analyze(text, ext, { today: TODAY });
    const f = r.findings.find((x) => x.ruleId === "FL-06");
    expect(f?.verdict).toBe("CHECK");
    expect(f?.body).toContain("first year");
    expect(f?.body).toContain("two months' notice");
  });

  it("is still not enforceable when only landlord_can_terminate is ticked", () => {
    const f = withTercera((c) => ({ ...c, signals: ["landlord_can_terminate"] }));
    expect(f?.verdict).toBe("ILLEGAL");
  });

  it("is still not enforceable for a company landlord, whatever the signals", () => {
    const f = withTercera((c) => c, { landlord_type: "legal_person" });
    expect(f?.verdict).toBe("ILLEGAL");
  });
});

describe("art93Evidence", () => {
  it("accepts the clause as written in the clean contract", () => {
    const e = art93Evidence(
      "podrá necesitar ocupar la vivienda antes del transcurso de cinco años para destinarla a vivienda permanente de su hija, siempre que haya transcurrido el primer año de contrato y lo comunique con al menos dos meses de antelación",
    );
    expect(e).toEqual({ missing: [], otherGround: false });
  });

  it("names what is missing", () => {
    expect(art93Evidence("el arrendador podrá necesitar la vivienda para sí").missing).toEqual(["that it can only happen after the first year", "two months' notice"]);
  });

  it("spots free termination wording", () => {
    for (const q of ["podrá resolver libremente el contrato", "si decide vender la vivienda", "sin necesidad de causa", "en cualquier momento"]) {
      expect(art93Evidence(q).otherGround, q).toBe(true);
    }
  });
});
