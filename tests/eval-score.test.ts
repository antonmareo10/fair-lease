import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import type { Extraction } from "@/lib/extraction";
import { EVAL_TODAY, loadContract, loadGold } from "@/scripts/eval/pipeline";
import {
  articleBase,
  clauseNumber,
  entriesFromFairLease,
  entriesFromModel,
  fairLeaseLawFrom,
  fairLeaseTotalEur,
  firstEuro,
  normalizeCitation,
  parseFairLeaseArticle,
  scoreContract,
  summarizeRun,
  type ModelAloneOutput,
} from "@/scripts/eval/score";
import { reform, traps, fair } from "./fixtures";

const gold = loadGold();
const fixtures = { "traps-2025": traps, "fair-2024": fair, "reform-oct-2026": reform };

function fairLeaseScore(id: keyof typeof fixtures) {
  const contract = loadContract(gold, id);
  const extraction = fixtures[id].extraction as Extraction;
  const result = analyze(contract.text, extraction, { today: EVAL_TODAY });
  return scoreContract({
    gold: gold.contracts[id],
    text: contract.text,
    fixtureQuotes: contract.fixtureQuotes,
    entries: entriesFromFairLease(result),
    lawVersionFrom: fairLeaseLawFrom(result),
    totalEur: fairLeaseTotalEur(result),
    byRule: true,
  });
}

describe("eval GOLD file", () => {
  it("has 41 rows: 15 not enforceable, 2 worth checking, 24 fine", () => {
    const units = Object.values(gold.contracts).flatMap((c) => c.units);
    expect(units).toHaveLength(41);
    expect(units.filter((u) => u.verdict === "ILLEGAL")).toHaveLength(15);
    expect(units.filter((u) => u.verdict === "CHECK")).toHaveLength(2);
    expect(units.filter((u) => u.verdict === "OK")).toHaveLength(24);
  });

  it("anchors every row in the contract text and gives it a clause number", () => {
    for (const id of Object.keys(gold.contracts)) {
      const contract = loadContract(gold, id);
      for (const unit of gold.contracts[id].units) {
        expect(unit.fixture?.length, unit.id).toBeGreaterThan(0);
        for (const i of unit.fixture ?? []) {
          expect(contract.fixtureQuotes[i], `${unit.id} fixture ${i}`).toBeDefined();
          expect(clauseNumber(contract.fixtureQuotes[i].clause_ref), unit.id).not.toBeNull();
        }
      }
    }
  });

  it.each(Object.keys(fixtures) as (keyof typeof fixtures)[])("the engine on the hand-made extraction scores 100% on %s", (id) => {
    const s = fairLeaseScore(id);
    const wrong = s.units.filter((u) => !u.correct).map((u) => `${u.id}: gold ${u.gold}, got ${u.got}`);
    expect(wrong).toEqual([]);
    expect(s.extraFlags).toBe(0);
    expect(s.quotesNotInText).toBe(0);
    expect(s.citationsInvented).toBe(0);
    expect(s.citationsWrong).toBe(0);
    expect(s.lawVersionCorrect).toBe(true);
  });

  it("Fair Lease gets the three clause euros and the total of GOLD (€2,300, €3,450, €1,391.50, €7,141.50)", () => {
    const s = fairLeaseScore("traps-2025");
    expect(s.units.filter((u) => u.euroCorrect !== null).map((u) => [u.id, u.overEur, u.euroCorrect])).toEqual([
      ["traps-TERCERA-FL-04", 2300, true],
      ["traps-QUINTA-FL-02", 3450, true],
      ["traps-SEXTA-FL-03", 1391.5, true],
    ]);
    expect(s.totalEur).toBeCloseTo(7141.5, 2);
    expect(s.totalEurCorrect).toBe(true);
  });
});

describe("eval scoring helpers", () => {
  it("reads article numbers and laws", () => {
    expect(articleBase("36.5")).toBe("36");
    expect(articleBase("art. 9 bis.2")).toBe("9 bis");
    expect(normalizeCitation("Ley de Arrendamientos Urbanos", "17.2")).toEqual({ law: "LAU", art: "17" });
    expect(normalizeCitation("Código Civil", "1.554")).toEqual({ law: "CC", art: "1" });
    expect(normalizeCitation("LAU", "sin número")).toBeNull();
  });

  it("parses Fair Lease's own article strings", () => {
    expect(parseFairLeaseArticle("LAU arts. 9.1 and 6")).toEqual([
      { law: "LAU", art: "9" },
      { law: "LAU", art: "6" },
    ]);
    expect(parseFairLeaseArticle("LAU art. 3.2 · Civil Code art. 6.4")).toEqual([
      { law: "LAU", art: "3" },
      { law: "CC", art: "6" },
    ]);
    expect(parseFairLeaseArticle("LAU art. 36.5 (since 8 Oct 2026)")).toEqual([{ law: "LAU", art: "36" }]);
    expect(parseFairLeaseArticle("Spanish Constitution art. 18.2")).toEqual([{ law: "CE", art: "18" }]);
    expect(parseFairLeaseArticle("Ley 7/1985 (LBRL) art. 15")).toEqual([{ law: "LBRL", art: "15" }]);
  });

  it("recognises clause headings in the ways a model writes them", () => {
    expect(clauseNumber("QUINTA")).toBe(5);
    expect(clauseNumber("Cláusula DÉCIMA")).toBe(10);
    expect(clauseNumber("DECIMOCUARTA")).toBe(14);
    expect(clauseNumber("Decimotercera")).toBe(13);
    expect(clauseNumber("5ª")).toBe(5);
    expect(clauseNumber("Cláusula undécima (empadronamiento)")).toBe(11);
    expect(clauseNumber("TÍTULO")).toBe(0);
    expect(clauseNumber("Encabezado")).toBeNull();
  });

  it("reads euros from Fair Lease's numbers", () => {
    expect(firstEuro("5 months of guarantees · €3,450 over the limit")).toBe(3450);
    expect(firstEuro("€1,391.50 charged to you")).toBe(1391.5);
    expect(firstEuro("2 months too many")).toBeNull();
  });
});

describe("eval scoring of a model-alone answer", () => {
  const id = "traps-2025";
  const contract = loadContract(gold, id);
  const quoteOf = (ref: string, n = 0) => contract.fixtureQuotes.filter((q) => q.clause_ref === ref)[n].quote;
  const answer: ModelAloneOutput = {
    law_version_name: "LAU tras la Ley 12/2023",
    law_version_in_force_from: "2023-05-26",
    clauses: [
      { clause_ref: "SEGUNDA", quote: quoteOf("SEGUNDA"), verdict: "not_enforceable", articles: [{ law: "LAU", article: "9.1" }], euros_over_limit: null, reason: "x" },
      // Two mistakes in one entry: right verdict, article that does not exist.
      { clause_ref: "TERCERA", quote: quoteOf("TERCERA", 1), verdict: "not_enforceable", articles: [{ law: "LAU", article: "17.2" }, { law: "LAU", article: "52" }], euros_over_limit: 2300, reason: "x" },
      // A fine clause called not enforceable, with euros.
      { clause_ref: "DUODÉCIMA", quote: quoteOf("DUODÉCIMA"), verdict: "not_enforceable", articles: [{ law: "LAU", article: "27" }], euros_over_limit: 500, reason: "x" },
      // A made-up quote that fails the literal check, matched through its clause number.
      { clause_ref: "UNDÉCIMA", quote: "Se prohíbe empadronarse en la vivienda arrendada bajo ningún concepto", verdict: "not_enforceable", articles: [{ law: "LBRL", article: "15" }], euros_over_limit: null, reason: "x" },
      // A real quote on a point GOLD does not label, flagged.
      { clause_ref: "PRIMERA", quote: "se destinará exclusivamente a vivienda habitual de LA ARRENDATARIA", verdict: "review", articles: [], euros_over_limit: null, reason: "x" },
    ],
    total_euros_over_limit_at_signing: 5000,
  };
  const s = scoreContract({
    gold: gold.contracts[id],
    text: contract.text,
    fixtureQuotes: contract.fixtureQuotes,
    entries: entriesFromModel(answer),
    lawVersionFrom: answer.law_version_in_force_from,
    totalEur: answer.total_euros_over_limit_at_signing,
    byRule: false,
  });
  const unit = (unitId: string) => s.units.find((u) => u.id === unitId)!;

  it("matches entries to rows by where the quote sits", () => {
    expect(unit("traps-SEGUNDA-FL-05")).toMatchObject({ got: "ILLEGAL", correct: true, articleStatus: "correct" });
    expect(unit("traps-TERCERA-FL-04")).toMatchObject({ got: "ILLEGAL", correct: true, euroCorrect: true });
    expect(unit("traps-TERCERA-FL-15")).toMatchObject({ got: "OK", correct: true, matched: false });
  });

  it("falls back to the clause number when the quote is not in the text, and counts the quote as missing", () => {
    expect(unit("traps-UNDECIMA-FL-14")).toMatchObject({ got: "ILLEGAL", correct: true, matched: true });
    expect(s.quotesNotInText).toBe(1);
  });

  it("counts invented articles, false alarms, spurious euros and extra flags", () => {
    expect(s.citationsInvented).toBe(1);
    expect(unit("traps-DUODECIMA-OK-PETS")).toMatchObject({ got: "ILLEGAL", correct: false });
    expect(s.euroSpurious).toBe(1);
    expect(s.extraFlags).toBe(1);
    expect(s.totalEurCorrect).toBe(false);
  });

  it("judges the version of the law by the legal period it belongs to, not by an exact date", () => {
    const withVersion = (lawVersionFrom: string | null, id: keyof typeof fixtures = "traps-2025") => {
      const c = loadContract(gold, id);
      return scoreContract({ gold: gold.contracts[id], text: c.text, fixtureQuotes: c.fixtureQuotes, entries: [], lawVersionFrom, totalEur: null, byRule: false }).lawVersionCorrect;
    };
    expect(withVersion("2023-05-26")).toBe(true);
    expect(withVersion("2023-12-28")).toBe(true); // a later change inside the same period
    expect(withVersion("2019-03-06")).toBe(false); // the 2019 text, missing the May 2023 reform
    expect(withVersion(null)).toBe(false);
    expect(withVersion("pre-2019")).toBe(false);
    expect(withVersion("2023-05-26", "reform-oct-2026")).toBe(false); // the Oct 2026 reform is not in that version
    expect(withVersion("2026-10-08", "reform-oct-2026")).toBe(true);
  });

  it("treats rows the model never mentions as not flagged, so missed problems count as misses", () => {
    expect(unit("traps-CUARTA-FL-08")).toMatchObject({ gold: "ILLEGAL", got: "OK", matched: false, correct: false });
    const run = summarizeRun([s]);
    expect(run.illegalFound).toBe(3);
    expect(run.illegalTotal).toBe(10);
    expect(run.falseAlarms).toBe(1);
  });
});
