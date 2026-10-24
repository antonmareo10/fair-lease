import type { Segment } from "./segments";

/** The part of the contract text that is folded away: [from, to), where `to` is the start of a paragraph. */
export type Fold = { from: number; to: number; paragraphs: number };

/** Below this many lines of text the opening isn't worth a fold (it would barely move the first highlight). */
const MIN_LINES = 8;
/** Rough characters per line of the sheet at desktop width; only used to decide whether a fold pays off. */
const CHARS_PER_LINE = 75;

const lineStart = (text: string, at: number) => text.lastIndexOf("\n", at - 1) + 1;

/** A heading that fills its whole line ("EXPONEN", "CLÁUSULAS") right before `at` goes with the paragraph that follows it. */
function pullBackOverHeading(text: string, segments: Segment[], at: number): number {
  let end = at;
  for (let n = 0; n < 3; n++) {
    let p = end;
    while (p > 0 && /\s/.test(text[p - 1])) p--;
    if (p === 0) break;
    const q = lineStart(text, p);
    const line = text.slice(q, p);
    const whole = segments.some((s) => s.heading && s.start === q && s.end === p && line.trim().length > 0);
    if (!whole) break;
    end = q;
  }
  return end;
}

/**
 * The unmarked opening of a contract (title, parties, background), which is where the page has nothing to show:
 * every highlight comes later. Folding it brings the first highlight, and its margin note, onto the first screen.
 * The title stays visible. Returns null when there is little to fold or the text opens with a highlight.
 */
export function findFold(text: string, segments: Segment[]): Fold | null {
  const first = segments.find((s) => s.top);
  if (!first) return null;
  const title = segments.find((s) => s.title);
  const from = title && title.end <= first.start ? title.end : 0;
  const to = pullBackOverHeading(text, segments, lineStart(text, first.start));
  if (to <= from) return null;
  const lines = text
    .slice(from, to)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const estimate = lines.reduce((sum, l) => sum + Math.ceil(l.length / CHARS_PER_LINE), 0) + Math.max(0, lines.length - 1);
  if (estimate < MIN_LINES) return null;
  return { from, to, paragraphs: lines.length };
}

const clip = (segments: Segment[], a: number, b: number): Segment[] =>
  segments.filter((s) => s.end > a && s.start < b).map((s) => ({ ...s, start: Math.max(s.start, a), end: Math.min(s.end, b) }));

/** The segments before, inside and after the fold. The folded part is trimmed so the fold's own spacing is the only gap. */
export function splitAtFold(text: string, segments: Segment[], fold: Fold): { head: Segment[]; folded: Segment[]; tail: Segment[] } {
  let a = fold.from;
  let b = fold.to;
  while (a < b && /\s/.test(text[a])) a++;
  while (b > a && /\s/.test(text[b - 1])) b--;
  return { head: clip(segments, 0, fold.from), folded: clip(segments, a, b), tail: clip(segments, fold.to, text.length) };
}
