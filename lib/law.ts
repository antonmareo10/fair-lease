/**
 * Law Version Resolver (spec.md > Law Version Resolver, LEGAL_RULES.md §0).
 * A contract is governed by the LAU text in force on the day it was signed.
 */

export type Regime = "A" | "B" | "C" | "pre2019";

export type LawVersion = {
  regime: Regime;
  date: string; // ISO date the check is based on
  assumedToday: boolean; // no signing date found in the contract
  picked: boolean; // the tenant picked the date because the contract has none
  window1to2Oct2026: boolean; // signed while the repealed RDL 26/2026 was briefly in force
  pendingVote: boolean; // RDL 29/2026 still needs Congress (Diputación Permanente) approval
  sentence: string;
};

export const MILESTONES = [
  { date: "2019-03-06", label: "Mar 2019", name: "2019 rules", detail: "RDL 7/2019" },
  { date: "2023-05-26", label: "May 2023", name: "May 2023 rules", detail: "Ley 12/2023" },
  { date: "2026-10-08", label: "Oct 2026", name: "Oct 2026 reform", detail: "RDL 29/2026 · pending Congress vote" },
] as const;

const REGIME_NAME: Record<Regime, string> = {
  pre2019: "pre-2019 rules (not covered)",
  A: "the 2019 rules apply",
  B: "the May 2023 rules apply",
  C: "the 8 Oct 2026 reform applies (pending Congress vote)",
};

export function isoToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidIsoDate(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function regimeFor(iso: string): Regime {
  if (iso < "2019-03-06") return "pre2019";
  if (iso <= "2023-05-25") return "A";
  if (iso <= "2026-10-07") return "B";
  return "C";
}

export function resolveLaw(signingDate: string | null, today: string = isoToday()): LawVersion {
  const assumedToday = !isValidIsoDate(signingDate);
  const date = assumedToday ? today : (signingDate as string);
  const regime = regimeFor(date);
  const window1to2Oct2026 = date === "2026-10-01" || date === "2026-10-02";
  const lead = assumedToday ? `No signing date · checked as of ${formatLongDate(date)}` : `Signed ${formatLongDate(date)}`;
  return {
    regime,
    date,
    assumedToday,
    window1to2Oct2026,
    picked: false,
    pendingVote: regime === "C",
    sentence: `${lead} → ${REGIME_NAME[regime]}`,
  };
}

/** Add whole years to an ISO date and step back one day: the last day of an N-year term. */
export function endOfTerm(startIso: string, years: number): string {
  const d = new Date(`${startIso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** First contract anniversary (start + n years, n ≥ 1) falling on or after `fromIso`. */
export function nextAnniversary(startIso: string, fromIso: string): string {
  const d = new Date(`${startIso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  while (d.toISOString().slice(0, 10) < fromIso) d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
