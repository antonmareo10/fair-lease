import type { Span } from "@/lib/quotes";
import type { Finding, Verdict } from "@/lib/rules/types";
import { SEVERITY } from "@/lib/rules/types";

export type Segment = {
  start: number;
  end: number;
  /** Clause indices whose verified quote covers this piece of text. */
  clauses: number[];
  /** Findings attached to those clauses, most severe first. */
  findings: Finding[];
  top: Verdict | null;
  heading: boolean;
  title: boolean;
};

// Clause headings in Spanish contracts: "QUINTA. FIANZA Y GARANTÍAS." at the start of a line.
const HEADING = /^(?:[A-ZÁÉÍÓÚÜÑ]+(?: [A-ZÁÉÍÓÚÜÑ]+)*\.)(?: [A-ZÁÉÍÓÚÜÑ ,Y]+\.)?/gmu;
const TITLE = /^[A-ZÁÉÍÓÚÜÑ ]{12,}$/mu;
// Section words on their own line: "REUNIDOS", "EXPONEN", "CLÁUSULAS".
const SECTION = /^[A-ZÁÉÍÓÚÜÑ]{5,}$/gmu;

/** Cut the contract into styled pieces: highlights from verified quotes, plus headings. */
export function buildSegments(text: string, spans: (Span | null)[], findings: Finding[]): Segment[] {
  const byClause = new Map<number, Finding[]>();
  for (const f of findings) for (const i of f.clauseIndices) byClause.set(i, [...(byClause.get(i) ?? []), f]);

  const highlighted = spans
    .map((span, index) => ({ span, index }))
    .filter((x): x is { span: Span; index: number } => x.span !== null && byClause.has(x.index));

  const headings: Span[] = [];
  for (const m of text.matchAll(HEADING)) headings.push({ start: m.index!, end: m.index! + m[0].length });
  for (const m of text.matchAll(SECTION)) headings.push({ start: m.index!, end: m.index! + m[0].length });
  const titleMatch = TITLE.exec(text);
  const title = titleMatch ? { start: titleMatch.index, end: titleMatch.index + titleMatch[0].length } : null;

  const cuts = new Set<number>([0, text.length]);
  for (const { span } of highlighted) cuts.add(span.start).add(span.end);
  for (const h of headings) cuts.add(h.start).add(h.end);
  if (title) cuts.add(title.start).add(title.end);
  const points = [...cuts].sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let k = 0; k < points.length - 1; k++) {
    const start = points[k];
    const end = points[k + 1];
    if (end <= start) continue;
    const clauses = highlighted.filter(({ span }) => span.start <= start && span.end >= end).map((x) => x.index);
    const seen = new Set<string>();
    const fs = clauses
      .flatMap((i) => byClause.get(i) ?? [])
      .filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)))
      .sort((a, b) => SEVERITY[b.verdict] - SEVERITY[a.verdict]);
    segments.push({
      start,
      end,
      clauses,
      findings: fs,
      top: fs[0]?.verdict ?? null,
      heading: headings.some((h) => h.start <= start && h.end >= end),
      title: !!title && title.start <= start && title.end >= end,
    });
  }
  return segments;
}
