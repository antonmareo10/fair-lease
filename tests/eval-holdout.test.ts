import { describe, expect, it } from "vitest";
import { normalizeWithMap, locateQuote, type Span } from "@/lib/quotes";
import { regimeFor } from "@/lib/law";
import { checkInput } from "@/lib/validate";
import { loadContract, loadGold } from "@/scripts/eval/pipeline";
import { clauseNumber, entriesFromModel, REGIME_START, scoreContract, summarizeRun, type ModelAloneOutput } from "@/scripts/eval/score";

/**
 * The held-out set (eval/holdout): six contracts labelled by hand before any run on them.
 * These checks keep the labels well-formed: every anchor is literally in the anonymised text, inside the clause
 * its row names, no two rows share a passage, and the dates, regimes and articles are consistent.
 */
const gold = loadGold(".", "holdout");
const ids = Object.keys(gold.contracts);

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function isoOf(signedLong: string): string {
  const m = /^(\d{1,2}) de (\p{L}+) de (\d{4})$/u.exec(signedLong);
  if (!m) throw new Error(`bad date ${signedLong}`);
  return `${m[3]}-${String(MONTHS.indexOf(m[2]) + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

const HEADING = /^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|UNDÉCIMA|DUODÉCIMA|DECIMOTERCERA|DECIMOCUARTA|DECIMOQUINTA|DECIMOSEXTA|DECIMOSÉPTIMA|DECIMOCTAVA|DECIMONOVENA|VIGÉSIMA)\./gmu;

/** Clause number (0 = title and preamble) for every offset of the text. */
function sections(text: string): { start: number; n: number }[] {
  const out = [{ start: 0, n: 0 }];
  for (const m of text.matchAll(HEADING)) out.push({ start: m.index ?? 0, n: clauseNumber(m[1]) ?? -1 });
  return out;
}
const sectionAt = (secs: { start: number; n: number }[], at: number) => secs.filter((s) => s.start <= at).at(-1)?.n ?? 0;

describe("held-out GOLD", () => {
  it("has six contracts and 84 rows: 16 not enforceable, 9 worth checking, 59 fine", () => {
    const units = Object.values(gold.contracts).flatMap((c) => c.units);
    expect(ids).toHaveLength(6);
    expect(units).toHaveLength(84);
    expect(units.filter((u) => u.verdict === "ILLEGAL")).toHaveLength(16);
    expect(units.filter((u) => u.verdict === "CHECK")).toHaveLength(9);
    expect(units.filter((u) => u.verdict === "OK")).toHaveLength(59);
    expect(new Set(units.map((u) => u.id)).size).toBe(units.length);
  });

  it.each(ids)("%s: dates, regime and input are consistent", (id) => {
    const g = gold.contracts[id];
    const contract = loadContract(gold, id);
    const iso = isoOf(g.signedLong);
    expect(contract.text).toContain(`En Madrid, a ${g.signedLong}.`);
    expect(regimeFor(iso)).toBe(g.regime);
    expect(g.lawVersionFrom).toBe(REGIME_START[g.regime]);
    expect(checkInput(contract.text).ok).toBe(true);
    // The anonymiser took every ID out (the eval sends the text as the app does).
    expect(contract.text).not.toMatch(/\b\d{8}[A-Z]\b|\b[XYZ]\d{7}[A-Z]\b/);
    expect(contract.text).toMatch(/\[(DNI|NIE)\]/);
  });

  it.each(ids)("%s: every anchor is literally in its own clause and no two rows share a passage", (id) => {
    const g = gold.contracts[id];
    const { text } = loadContract(gold, id);
    const norm = normalizeWithMap(text);
    const secs = sections(text);
    const taken: { unit: string; span: Span }[] = [];
    for (const unit of g.units) {
      expect(unit.quotes?.length, unit.id).toBeGreaterThan(0);
      const allowed = unit.ref.split("+").map((r) => clauseNumber(r));
      for (const q of unit.quotes ?? []) {
        const span = locateQuote(norm, text, q);
        expect(span, `${unit.id}: "${q.slice(0, 50)}…" not found`).not.toBeNull();
        if (!span) continue;
        expect(allowed, `${unit.id} sits in clause ${sectionAt(secs, span.start)}`).toContain(sectionAt(secs, span.start));
        for (const other of taken) {
          if (other.unit === unit.id) continue;
          const overlap = Math.min(span.end, other.span.end) - Math.max(span.start, other.span.start);
          expect(overlap, `${unit.id} overlaps ${other.unit}`).toBeLessThanOrEqual(0);
        }
        taken.push({ unit: unit.id, span });
      }
    }
  });

  it.each(ids)("%s: articles are normalised and every not-enforceable row accepts art. 6 LAU", (id) => {
    for (const unit of gold.contracts[id].units) {
      for (const a of unit.articles) expect(a, unit.id).toMatch(/^(LAU|CC|CE|LBRL|CP|TRLGDCU|LEC) \d+( bis)?$/);
      if (unit.verdict === "ILLEGAL") expect(unit.articles, unit.id).toContain("LAU 6");
      if (unit.verdict === "OK") expect(unit.articles, unit.id).toEqual([]);
      if (unit.verdict !== "OK") expect(unit.articles.length, unit.id).toBeGreaterThan(0);
      expect(unit.why?.length ?? 0, unit.id).toBeGreaterThan(10);
    }
  });

  it("scores a perfect answer 100% and silence as fine on every contract (the plumbing works offline)", () => {
    const VERDICT = { ILLEGAL: "not_enforceable", CHECK: "review", OK: "correct" } as const;
    for (const id of ids) {
      const g = gold.contracts[id];
      const contract = loadContract(gold, id);
      const perfect: ModelAloneOutput = {
        law_version_name: "LAU",
        law_version_in_force_from: g.lawVersionFrom,
        total_euros_over_limit_at_signing: g.totalOverEur || null,
        clauses: g.units.map((u) => ({
          clause_ref: u.ref,
          quote: (u.quotes ?? [])[0],
          verdict: VERDICT[u.verdict],
          articles: u.articles.slice(0, 1).map((a) => ({ law: a.split(" ")[0], article: a.split(" ").slice(1).join(" ") })),
          euros_over_limit: u.overEur ?? null,
          reason: "",
        })),
      };
      const base = { gold: g, text: contract.text, fixtureQuotes: contract.fixtureQuotes, byRule: false };
      const best = scoreContract({ ...base, entries: entriesFromModel(perfect), lawVersionFrom: g.lawVersionFrom, totalEur: perfect.total_euros_over_limit_at_signing });
      expect(best.units.filter((u) => !u.correct).map((u) => u.id), id).toEqual([]);
      expect(best.lawVersionCorrect, id).toBe(true);
      expect(best.extraFlags + best.flagsOnFineOtherRule, id).toBe(0);
      const s = summarizeRun([best]);
      expect(s.eurosCorrect, id).toBe(s.eurosTotal);

      const silent = scoreContract({ ...base, entries: [], lawVersionFrom: null, totalEur: null });
      expect(silent.units.filter((u) => u.correct).length, id).toBe(g.units.filter((u) => u.verdict === "OK").length);
    }
  });

  it("counts a flag under another rule on a fine row (Fair Lease's by-rule matching)", () => {
    const id = "ho-2024-fair";
    const g = gold.contracts[id];
    const contract = loadContract(gold, id);
    const smoking = g.units.find((u) => u.rule === "OK-SMOKING")!;
    const norm = normalizeWithMap(contract.text);
    const span = locateQuote(norm, contract.text, smoking.quotes![0])!;
    const s = scoreContract({
      gold: g,
      text: contract.text,
      fixtureQuotes: [],
      entries: [{ ref: "UNDÉCIMA", quotes: [smoking.quotes![0]], verdict: "ILLEGAL", citations: [], overEur: null, rule: "FL-13", spans: [span] }],
      lawVersionFrom: g.lawVersionFrom,
      totalEur: null,
      byRule: true,
    });
    expect(s.flagsOnFineOtherRule).toBe(1);
    expect(s.extraFlags).toBe(1);
    expect(s.units.every((u) => u.correct)).toBe(true);
  });
});
