/**
 * Scoring for the "Fair Lease vs the model alone" evaluation (eval/README.md).
 *
 * Both configurations are reduced to the same thing, a list of Entries (one verdict about a passage of
 * the contract, with the articles it cites and the euros it says are over the limit), and are then
 * matched to the hand-made GOLD units by where the passage sits in the contract text. Nothing here
 * calls a model: scores can be recomputed offline from the stored raw outputs.
 */
import { locateQuote, normalizeWithMap, type Span } from "@/lib/quotes";
import type { AnalysisResult } from "@/lib/analyze";
import { isValidIsoDate, regimeFor } from "@/lib/law";
import { computeMoney } from "@/lib/money";

export type GoldVerdict = "ILLEGAL" | "CHECK" | "OK";

export type GoldUnit = {
  id: string;
  ref: string;
  rule: string;
  fixture: number[];
  verdict: GoldVerdict;
  articles: string[];
  overEur?: number;
};

export type GoldContract = {
  title: string;
  sample: string;
  signedLong: string;
  regime: "A" | "B" | "C";
  lawVersionFrom: string;
  totalOverEur: number;
  units: GoldUnit[];
};

export type Gold = { source: string; contracts: Record<string, GoldContract> };

export type Law = "LAU" | "CC" | "CE" | "LBRL" | "CP" | "OTHER";
export type Citation = { law: Law; art: string };

/** One verdict about one passage of the contract, from either configuration. */
export type Entry = {
  ref: string;
  /** The literal passages the verdict rests on (as written by the tool). */
  quotes: string[];
  verdict: GoldVerdict;
  citations: Citation[];
  overEur: number | null;
  /** Fair Lease only: the rule that produced it. */
  rule?: string;
  /** Fair Lease only: spans already verified by the quote checker. */
  spans?: Span[];
};

export const REGIME_START: Record<"A" | "B" | "C", string> = { A: "2019-03-06", B: "2023-05-26", C: "2026-10-08" };

// ---------- articles ----------

/** Articles that exist in the consolidated LAU (BOE-A-1994-26003, checked 24 Oct 2026): 1-40, 9 bis and 21 bis. */
export const LAU_ARTICLES = new Set<string>([...Array.from({ length: 40 }, (_, i) => String(i + 1)), "9 bis", "21 bis"]);

function lawOf(text: string): Law {
  const t = text.toLowerCase();
  if (/\blau\b|arrendamientos urbanos|29\/1994/.test(t)) return "LAU";
  if (/c[oó]digo civil|civil code|\bcc\b/.test(t)) return "CC";
  if (/constituci|\bce\b/.test(t)) return "CE";
  if (/lbrl|7\/1985|r[eé]gimen local/.test(t)) return "LBRL";
  if (/c[oó]digo penal|\bcp\b/.test(t)) return "CP";
  return "OTHER";
}

/** "36.5" → "36", "9 bis.2" → "9 bis", "art. 21.1 y 21.4" → "21". */
export function articleBase(article: string): string | null {
  const m = /(\d+)\s*(bis|ter|quater)?/i.exec(article);
  if (!m) return null;
  return m[2] ? `${Number(m[1])} ${m[2].toLowerCase()}` : String(Number(m[1]));
}

export function normalizeCitation(law: string, article: string): Citation | null {
  const art = articleBase(article);
  if (!art) return null;
  return { law: lawOf(law), art };
}

/** Parse Fair Lease's own article strings: "LAU arts. 9.1 and 6", "LAU art. 3.2 · Civil Code art. 6.4". */
export function parseFairLeaseArticle(text: string): Citation[] {
  const out: Citation[] = [];
  for (const part of text.split("·")) {
    const law = lawOf(part.replace(/^\s*Spanish Constitution/i, "CE"));
    const afterArt = /arts?\.\s*(.+)$/i.exec(part)?.[1] ?? "";
    for (const piece of afterArt.replace(/\(.*?\)/g, "").split(/\band\b|,|\by\b/i)) {
      const art = articleBase(piece);
      if (art) out.push({ law, art });
    }
  }
  return out;
}

export const citationLabel = (c: Citation) => `${c.law} ${c.art}`;
const accepted = (unit: GoldUnit, c: Citation) => unit.articles.includes(citationLabel(c));
const exists = (c: Citation) => c.law !== "LAU" || LAU_ARTICLES.has(c.art);

// ---------- clause references ----------

const ORDINALS: [string, number][] = [
  ["decimotercera", 13],
  ["decimocuarta", 14],
  ["duodecima", 12],
  ["undecima", 11],
  ["decima", 10],
  ["novena", 9],
  ["octava", 8],
  ["septima", 7],
  ["sexta", 6],
  ["quinta", 5],
  ["cuarta", 4],
  ["tercera", 3],
  ["segunda", 2],
  ["primera", 1],
  ["titulo", 0],
];

/** "Cláusula DÉCIMA", "5ª", "quinta (fianza)" → 10, 5, 5. Null if nothing recognisable. */
export function clauseNumber(ref: string): number | null {
  const s = ref
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "");
  for (const [word, n] of ORDINALS) if (s.includes(word)) return n;
  const digits = /(\d{1,2})/.exec(s);
  return digits ? Number(digits[1]) : null;
}

// ---------- matching ----------

type Anchor = { spans: Span[]; numbers: Set<number> };

const len = (s: Span) => s.end - s.start;
function overlap(a: Span, b: Span): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

/** Best overlap between two sets of spans: containment (against the shorter) and intersection over union. */
function closeness(a: Span[], b: Span[]): { frac: number; iou: number } {
  let frac = 0;
  let iou = 0;
  for (const x of a) {
    for (const y of b) {
      const o = overlap(x, y);
      if (o === 0) continue;
      frac = Math.max(frac, o / Math.min(len(x), len(y)));
      iou = Math.max(iou, o / (len(x) + len(y) - o));
    }
  }
  return { frac, iou };
}

const SEVERITY: Record<GoldVerdict, number> = { ILLEGAL: 2, CHECK: 1, OK: 0 };

export type UnitResult = {
  id: string;
  rule: string;
  gold: GoldVerdict;
  /** What the configuration said about this unit; "OK" with matched=false means it did not mention it. */
  got: GoldVerdict;
  matched: boolean;
  correct: boolean;
  articleStatus: "correct" | "wrong" | "none" | "n/a";
  citations: string[];
  overEur: number | null;
  euroCorrect: boolean | null;
};

export type ContractScore = {
  units: UnitResult[];
  /** Flags (not enforceable / worth checking) that match no GOLD unit. */
  extraFlags: number;
  entries: number;
  /** Entries whose quote is not literally in the contract (model alone; Fair Lease shows none by construction). */
  quotesNotInText: number;
  citations: number;
  citationsInvented: number;
  /** Citations of a LAU article that exists but is not one accepted for the row (rows with a gold flag the tool also flagged). */
  citationsWrong: number;
  /** Citations on rows where the tool flagged and gold agrees there is a problem. */
  citationsOnFlagged: number;
  lawVersionCorrect: boolean | null;
  totalEur: number | null;
  totalEurCorrect: boolean | null;
  euroSpurious: number;
};

export type Resolved = { entry: Entry; spans: Span[]; located: boolean };

/** Find where each entry sits in the contract; entries without verified spans are looked up by quote. */
export function resolveEntries(text: string, entries: Entry[]): Resolved[] {
  const norm = normalizeWithMap(text);
  return entries.map((entry) => {
    if (entry.spans) return { entry, spans: entry.spans, located: true };
    const spans = entry.quotes.map((q) => locateQuote(norm, text, q)).filter((s): s is Span => s !== null);
    const written = entry.quotes.filter((q) => q.trim().length > 0);
    return { entry, spans, located: written.length > 0 && spans.length === written.length };
  });
}

export function anchorsOf(text: string, gold: GoldContract, fixtureQuotes: { clause_ref: string; quote: string }[]): Anchor[] {
  const norm = normalizeWithMap(text);
  return gold.units.map((u) => ({
    spans: u.fixture.map((i) => locateQuote(norm, text, fixtureQuotes[i].quote)).filter((s): s is Span => s !== null),
    numbers: new Set(u.fixture.map((i) => clauseNumber(fixtureQuotes[i].clause_ref)).filter((n): n is number => n !== null)),
  }));
}

export type ScoreInput = {
  gold: GoldContract;
  text: string;
  fixtureQuotes: { clause_ref: string; quote: string }[];
  entries: Entry[];
  /** Date (yyyy-mm-dd) from which the version of the law the tool applied is in force; judged by the legal period it falls in. */
  lawVersionFrom: string | null;
  totalEur: number | null;
  /** Fair Lease compares rule ids too; the model alone has none. */
  byRule: boolean;
};

const EUR_TOLERANCE = 1;

export function scoreContract(input: ScoreInput): ContractScore {
  const { gold, text, fixtureQuotes, entries } = input;
  const anchors = anchorsOf(text, gold, fixtureQuotes);
  const resolved = resolveEntries(text, entries);

  // Attach each entry to the units it sits on; each unit keeps its closest entry.
  const best: ({ r: Resolved; iou: number } | null)[] = gold.units.map(() => null);
  const attached = new Set<number>();
  resolved.forEach((r, ri) => {
    gold.units.forEach((unit, ui) => {
      if (input.byRule && r.entry.rule && r.entry.rule !== unit.rule) return;
      let iou = 0;
      let ok = false;
      if (r.spans.length > 0) {
        const c = closeness(r.spans, anchors[ui].spans);
        ok = c.frac >= 0.5;
        iou = c.iou;
      } else if (!r.located) {
        // Unverifiable quote: fall back to the clause number, only when it points at exactly one unit.
        const n = clauseNumber(r.entry.ref);
        const sameClause = anchors.filter((a) => n !== null && a.numbers.has(n));
        ok = n !== null && sameClause.length === 1 && anchors[ui].numbers.has(n);
        iou = 0.01;
      }
      if (!ok) return;
      attached.add(ri);
      const cur = best[ui];
      if (!cur || iou > cur.iou || (iou === cur.iou && SEVERITY[r.entry.verdict] > SEVERITY[cur.r.entry.verdict])) best[ui] = { r, iou };
    });
  });

  const units: UnitResult[] = gold.units.map((unit, ui) => {
    const hit = best[ui];
    const got: GoldVerdict = hit ? hit.r.entry.verdict : "OK";
    const flagged = got !== "OK";
    const citations = hit ? hit.r.entry.citations : [];
    let articleStatus: UnitResult["articleStatus"] = "n/a";
    if (unit.verdict !== "OK" && flagged) {
      articleStatus = citations.length === 0 ? "none" : citations.some((c) => accepted(unit, c)) ? "correct" : "wrong";
    }
    const overEur = hit ? hit.r.entry.overEur : null;
    return {
      id: unit.id,
      rule: unit.rule,
      gold: unit.verdict,
      got,
      matched: hit !== null,
      correct: got === unit.verdict,
      articleStatus,
      citations: citations.map(citationLabel),
      overEur,
      euroCorrect: unit.overEur === undefined ? null : overEur !== null && Math.abs(overEur - unit.overEur) <= EUR_TOLERANCE,
    };
  });

  const extraFlags = resolved.filter((r, ri) => !attached.has(ri) && r.entry.verdict !== "OK").length;
  const quotesNotInText = resolved.filter((r) => !r.located).length;

  let citations = 0;
  let citationsInvented = 0;
  let citationsWrong = 0;
  let citationsOnFlagged = 0;
  const flaggedUnitOf = new Map<Entry, GoldUnit>();
  best.forEach((b, ui) => {
    if (b && gold.units[ui].verdict !== "OK" && b.r.entry.verdict !== "OK") flaggedUnitOf.set(b.r.entry, gold.units[ui]);
  });
  for (const r of resolved) {
    for (const c of r.entry.citations) {
      if (c.law === "LAU") citations += 1;
      if (!exists(c)) {
        citationsInvented += 1;
        continue;
      }
      const unit = flaggedUnitOf.get(r.entry);
      if (unit && c.law === "LAU") {
        citationsOnFlagged += 1;
        if (!accepted(unit, c)) citationsWrong += 1;
      }
    }
  }

  const euroSpurious = units.filter((u) => u.gold === "OK" && u.overEur !== null && u.overEur > 0).length;
  const totalEurCorrect = gold.totalOverEur > 0 ? input.totalEur !== null && Math.abs(input.totalEur - gold.totalOverEur) <= EUR_TOLERANCE : null;

  return {
    units,
    extraFlags,
    entries: entries.length,
    quotesNotInText,
    citations,
    citationsInvented,
    citationsWrong,
    citationsOnFlagged,
    // Right version = the one the model names belongs to the same legal period as the signing date (A, B or C).
    lawVersionCorrect: isValidIsoDate(input.lawVersionFrom) && regimeFor(input.lawVersionFrom) === gold.regime,
    totalEur: input.totalEur,
    totalEurCorrect,
    euroSpurious,
  };
}

// ---------- adapters ----------

export type ModelAloneOutput = {
  law_version_name: string;
  law_version_in_force_from: string;
  clauses: {
    clause_ref: string;
    quote: string;
    verdict: "not_enforceable" | "review" | "correct";
    articles: { law: string; article: string }[];
    euros_over_limit: number | null;
    reason: string;
  }[];
  total_euros_over_limit_at_signing: number | null;
};

const MODEL_VERDICT: Record<ModelAloneOutput["clauses"][number]["verdict"], GoldVerdict> = {
  not_enforceable: "ILLEGAL",
  review: "CHECK",
  correct: "OK",
};

export function entriesFromModel(out: ModelAloneOutput): Entry[] {
  return out.clauses.map((c) => ({
    ref: c.clause_ref,
    quotes: [c.quote],
    verdict: MODEL_VERDICT[c.verdict],
    citations: c.articles.map((a) => normalizeCitation(a.law, a.article)).filter((c): c is Citation => c !== null),
    overEur: c.euros_over_limit,
  }));
}

/** First "€1,391.50" in a finding's number, read as en-GB. */
export function firstEuro(text: string | undefined): number | null {
  const m = /€\s?([\d,]+(?:\.\d+)?)/.exec(text ?? "");
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/** Rules whose number is an amount above the legal limit (FL-02, FL-03, FL-04); other numbers are not. */
const EXCESS_RULES = new Set(["FL-02", "FL-03", "FL-04"]);

export function entriesFromFairLease(r: AnalysisResult): Entry[] {
  return r.findings
    .filter((f) => f.verdict !== "INFO")
    .map((f) => ({
      ref: f.clauseIndices.map((i) => r.clauses[i].clause_ref).join("+"),
      quotes: f.clauseIndices.map((i) => r.clauses[i].quote),
      verdict: f.verdict as GoldVerdict,
      citations: parseFairLeaseArticle(f.law.article),
      overEur: EXCESS_RULES.has(f.ruleId) && f.verdict === "ILLEGAL" ? firstEuro(f.number) : null,
      rule: f.ruleId,
      spans: f.clauseIndices.map((i) => r.spans[i]).filter((s): s is Span => s !== null),
    }));
}

export function fairLeaseLawFrom(r: AnalysisResult): string {
  return r.law.regime === "pre2019" ? "pre-2019" : REGIME_START[r.law.regime];
}

export const fairLeaseTotalEur = (r: AnalysisResult): number | null => computeMoney(r)?.over ?? null;

// ---------- aggregation ----------

export type RunScore = {
  verdictCorrect: number;
  verdictTotal: number;
  illegalFound: number;
  illegalTotal: number;
  checkFound: number;
  checkTotal: number;
  okKept: number;
  okTotal: number;
  /** Gold-fine rows flagged "not enforceable". */
  falseAlarms: number;
  /** Gold-fine rows flagged "worth checking". */
  softAlarms: number;
  extraFlags: number;
  /** Not-enforceable / worth-checking rows the tool flagged where it also cited an article. */
  flaggedRightWithArticle: number;
  flaggedRight: number;
  citations: number;
  citationsInvented: number;
  citationsWrong: number;
  entries: number;
  quotesNotInText: number;
  lawVersionCorrect: number;
  lawVersionTotal: number;
  eurosCorrect: number;
  eurosTotal: number;
  euroSpurious: number;
};

export function summarizeRun(scores: ContractScore[]): RunScore {
  const units = scores.flatMap((s) => s.units);
  const count = (f: (u: UnitResult) => boolean) => units.filter(f).length;
  const euroUnits = units.filter((u) => u.euroCorrect !== null);
  const totals = scores.filter((s) => s.totalEurCorrect !== null);
  return {
    verdictCorrect: count((u) => u.correct),
    verdictTotal: units.length,
    illegalFound: count((u) => u.gold === "ILLEGAL" && u.got === "ILLEGAL"),
    illegalTotal: count((u) => u.gold === "ILLEGAL"),
    checkFound: count((u) => u.gold === "CHECK" && u.got === "CHECK"),
    checkTotal: count((u) => u.gold === "CHECK"),
    okKept: count((u) => u.gold === "OK" && u.got === "OK"),
    okTotal: count((u) => u.gold === "OK"),
    falseAlarms: count((u) => u.gold === "OK" && u.got === "ILLEGAL"),
    softAlarms: count((u) => u.gold === "OK" && u.got === "CHECK"),
    extraFlags: scores.reduce((a, s) => a + s.extraFlags, 0),
    flaggedRightWithArticle: count((u) => u.articleStatus === "correct"),
    flaggedRight: count((u) => u.gold !== "OK" && u.got !== "OK"),
    citations: scores.reduce((a, s) => a + s.citations, 0),
    citationsInvented: scores.reduce((a, s) => a + s.citationsInvented, 0),
    citationsWrong: scores.reduce((a, s) => a + s.citationsWrong, 0),
    entries: scores.reduce((a, s) => a + s.entries, 0),
    quotesNotInText: scores.reduce((a, s) => a + s.quotesNotInText, 0),
    lawVersionCorrect: scores.filter((s) => s.lawVersionCorrect).length,
    lawVersionTotal: scores.length,
    eurosCorrect: euroUnits.filter((u) => u.euroCorrect).length + totals.filter((s) => s.totalEurCorrect).length,
    eurosTotal: euroUnits.length + totals.length,
    euroSpurious: scores.reduce((a, s) => a + s.euroSpurious, 0),
  };
}
