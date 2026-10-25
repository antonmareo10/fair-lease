/**
 * Turns the positioned text pieces of a PDF (what pdf.js reports for each page) back into the plain
 * text a tenant would paste: one paragraph per clause, separated by blank lines, in reading order.
 * Pure and synchronous, so it is tested without a browser or a PDF library.
 */

/** One run of text on a page, in PDF points, y measured from the bottom of the page (as PDFs do). */
export type PdfItem = { str: string; x: number; y: number; w: number; h: number };
export type PdfPage = { width: number; height: number; items: PdfItem[] };

type Line = { text: string; x0: number; x1: number; y: number; h: number; colLeft: number; colRight: number };

/** Lines a page number or a running footer is made of: "Página 2 de 4", "Page 3", "- 2 -", "2/4". */
const PAGE_NUMBER = /^(?:(?:p[aá]gina|p[aá]g\.?|page)\s*\d+(?:\s*(?:de|of|\/)\s*\d+)?|-?\s*\d{1,3}\s*-?|\d{1,3}\s*\/\s*\d{1,3})$/iu;

/** A clause or section heading at the start of a line: "SEGUNDA. DURACIÓN.", "II. Que…", "3.1 ", "CLÁUSULAS". */
const STARTS_BLOCK = /^(?:[A-ZÁÉÍÓÚÜÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÜÑ]{2,})*\.(?:\s|$)|[IVXLC]{1,6}\.\s|\d{1,2}(?:\.\d{1,2})*[.)]\s|[A-ZÁÉÍÓÚÜÑ]{5,}$)/u;

/** A line that is nothing but a heading in capitals: "REUNIDOS", "CONTRATO DE ARRENDAMIENTO", "PRIMERA. OBJETO." */
const HEADING_LINE = /^(?:[A-ZÁÉÍÓÚÜÑ]{5,}|[A-ZÁÉÍÓÚÜÑ ]{12,}|[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ .,]{3,}\.)$/u;

/** A section word or a title alone on its line ("CLÁUSULAS"): it never continues the line before. */
const SECTION_LINE = /^(?:[A-ZÁÉÍÓÚÜÑ]{5,}|[A-ZÁÉÍÓÚÜÑ ]{12,})$/u;

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

function percentile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

const visible = (it: PdfItem) => it.str.trim().length > 0;

/** Group items that share a baseline into lines, left to right. Items must all belong to one column. */
function toLines(items: PdfItem[], colLeft: number, colRight: number): Line[] {
  const sorted = items.filter(visible).sort((a, b) => b.y - a.y || a.x - b.x);
  const groups: PdfItem[][] = [];
  for (const it of sorted) {
    const g = groups[groups.length - 1];
    const ref = g?.[0];
    if (ref && Math.abs(ref.y - it.y) <= 0.45 * Math.max(ref.h, it.h, 1)) g.push(it);
    else groups.push([it]);
  }
  return groups.map((g) => {
    g.sort((a, b) => a.x - b.x);
    let text = "";
    let prevEnd = -Infinity;
    for (const it of g) {
      const gap = it.x - prevEnd;
      const needsSpace = text.length > 0 && !/\s$/.test(text) && !/^\s/.test(it.str) && gap > 0.12 * Math.max(it.h, 1);
      text += (needsSpace ? " " : "") + it.str;
      prevEnd = Math.max(prevEnd, it.x + it.w);
    }
    const h = Math.max(...g.map((it) => it.h), 1);
    return {
      text: text.replace(/\s+/g, " ").trim(),
      x0: Math.min(...g.map((it) => it.x)),
      x1: Math.max(...g.map((it) => it.x + it.w)),
      y: median(g.map((it) => it.y)),
      h,
      colLeft,
      colRight,
    };
  });
}

/**
 * Find an empty vertical band in the middle of the text area that most lines respect: the gutter of a
 * two-column page. Returns its x, or null for a single-column page.
 */
export function findGutter(items: PdfItem[]): number | null {
  const vis = items.filter(visible).filter((it) => it.w > 0);
  if (vis.length < 8) return null;
  const left = Math.min(...vis.map((it) => it.x));
  const right = Math.max(...vis.map((it) => it.x + it.w));
  const width = right - left;
  if (width < 100) return null;
  const from = Math.floor(left + 0.25 * width);
  const to = Math.ceil(left + 0.75 * width);
  const allowed = Math.max(1, Math.floor(0.08 * vis.length)); // a title or a heading may cross the gutter
  let best: { start: number; end: number } | null = null;
  let runStart: number | null = null;
  for (let x = from; x <= to + 1; x++) {
    const crossing = x <= to ? vis.filter((it) => it.x < x && it.x + it.w > x).length : Infinity;
    if (crossing <= allowed) {
      runStart ??= x;
    } else if (runStart !== null) {
      if (!best || x - runStart > best.end - best.start) best = { start: runStart, end: x };
      runStart = null;
    }
  }
  if (!best || best.end - best.start < 10) return null;
  const g = (best.start + best.end) / 2;
  const leftLines = new Set(vis.filter((it) => it.x + it.w <= g).map((it) => Math.round(it.y)));
  const rightLines = new Set(vis.filter((it) => it.x >= g).map((it) => Math.round(it.y)));
  return leftLines.size >= 3 && rightLines.size >= 3 ? g : null;
}

/** Lines of one page in reading order: top to bottom, and on a two-column page the left column before the right one. */
export function pageLines(page: PdfPage): Line[] {
  const vis = page.items.filter(visible);
  if (vis.length === 0) return [];
  const left = Math.min(...vis.map((it) => it.x));
  const right = Math.max(...vis.map((it) => it.x + it.w));
  const gutter = findGutter(vis);
  if (gutter === null) return toLines(vis, left, right);
  const edge = (side: PdfItem[]) => (side.length ? Math.max(...side.map((it) => it.x + it.w)) : gutter);

  // Items that cross the gutter (a title, a full-width heading) cut the page into bands; each band reads left then right.
  const crossing = vis.filter((it) => it.x < gutter && it.x + it.w > gutter);
  const crossLines = toLines(crossing, left, right);
  const columns = vis.filter((it) => !crossing.includes(it));
  // Each column's real edges, so a full line of the left column doesn't look short against the gutter.
  const leftEdge = edge(columns.filter((it) => it.x + it.w / 2 < gutter));
  const rightStart = Math.min(...columns.filter((it) => it.x + it.w / 2 >= gutter).map((it) => it.x));
  const out: Line[] = [];
  let top = Infinity;
  for (const cut of [...crossLines.map((l) => l.y), -Infinity]) {
    const band = columns.filter((it) => it.y < top && it.y >= cut);
    out.push(...toLines(band.filter((it) => it.x + it.w / 2 < gutter), left, leftEdge));
    out.push(...toLines(band.filter((it) => it.x + it.w / 2 >= gutter), rightStart, right));
    const own = crossLines.find((l) => l.y === cut);
    if (own) out.push(own);
    top = cut;
  }
  return out;
}

const signature = (s: string) => s.replace(/\d+/g, "#").toLowerCase();

/** Running headers and footers: the same line (numbers aside) near the top or bottom of at least two pages. */
function repeatedEdges(pages: PdfPage[], lines: Line[][]): Set<string> {
  const seen = new Map<string, number>();
  pages.forEach((page, p) => {
    const edge = new Set<string>();
    for (const l of lines[p]) if (l.y > page.height * 0.9 || l.y < page.height * 0.1) edge.add(signature(l.text));
    for (const s of edge) seen.set(s, (seen.get(s) ?? 0) + 1);
  });
  return new Set([...seen].filter(([, n]) => n >= 2 && pages.length >= 2).map(([s]) => s));
}

function joinLines(a: string, b: string): string {
  // "contra-" + "to" → "contrato" only for a lowercase word broken at the end of a line.
  if (/[a-záéíóúüñ][-­‐]$/u.test(a) && /^[a-záéíóúüñ]/u.test(b)) return a.slice(0, -1) + b;
  return `${a} ${b}`;
}

/** Rebuild the contract text from its pages. */
export function layoutPdfText(pages: PdfPage[]): string {
  const lines = pages.map(pageLines);
  const edges = repeatedEdges(pages, lines);
  const paragraphs: string[] = [];
  let current: string | null = null;
  let prev: Line | null = null;

  const flush = () => {
    if (current && current.trim()) paragraphs.push(current.trim());
    current = null;
  };

  const kept = lines.map((ls) => ls.filter((l) => !PAGE_NUMBER.test(l.text) && !edges.has(signature(l.text))));
  // The usual distance from one line to the next. A low percentile, so that pages made of short paragraphs
  // (where the gaps between paragraphs outnumber the gaps between lines) don't hide it.
  const gaps = kept.flatMap((ls) => ls.slice(1).map((l, i) => ls[i].y - l.y)).filter((g) => g > 0);
  const pitch = percentile(gaps, 0.2) || 1.2 * median(kept.flat().map((l) => l.h));
  // Does this document leave space between paragraphs? Then that space is the signal, and the shape of a
  // line (short, ending in a full stop) is only a fallback for documents that don't.
  const spaced = gaps.filter((g) => g > 1.45 * pitch).length >= 2;

  kept.forEach((pageLines) => {
    pageLines.forEach((line, i) => {
      const before = i > 0 ? pageLines[i - 1] : prev;
      let newBlock = current === null || before === null;
      if (before) {
        const ended = /[.:;]$/.test(before.text);
        const short = before.x1 < before.colRight - 0.15 * (before.colRight - before.colLeft);
        const opensClause = (STARTS_BLOCK.test(line.text) && (ended || (short && !spaced))) || SECTION_LINE.test(line.text);
        const continuesElsewhere = i === 0 || before.y - line.y <= 0 || before.colLeft !== line.colLeft;
        if (continuesElsewhere) {
          // Top of a new page or column: the paragraph goes on unless the last line stopped short with a full
          // stop, or this line opens a new clause.
          newBlock ||= opensClause || (short && (ended || !spaced)) || HEADING_LINE.test(before.text);
        } else {
          newBlock ||=
            before.y - line.y > 1.45 * pitch || // blank space between paragraphs
            opensClause || // "TERCERA. RENTA." right after a sentence ends
            (short && HEADING_LINE.test(before.text)) || // a heading on its own line: "REUNIDOS"
            (!spaced && short && ended);
        }
      }
      if (newBlock) {
        flush();
        current = line.text;
      } else {
        current = joinLines(current ?? "", line.text);
      }
      prev = line;
    });
  });
  flush();
  return paragraphs.join("\n\n");
}
