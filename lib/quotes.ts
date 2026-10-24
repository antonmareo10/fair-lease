/**
 * Quote Verifier (spec.md > Quote Verifier).
 *
 * A quote counts only if it is literally in the contract. We forgive what a copy
 * can't preserve (Unicode forms, runs of whitespace, curly vs straight quotes,
 * dash variants) and nothing else: no fuzzy matching, no case folding.
 */

export type Span = { start: number; end: number };

type Normalized = { text: string; map: number[] };

const QUOTE_CHARS: Record<string, string> = {
  "“": '"',
  "”": '"',
  "„": '"',
  "«": '"',
  "»": '"',
  "‘": "'",
  "’": "'",
  "‚": "'",
  "′": "'",
  "–": "-",
  "—": "-",
  "−": "-",
};

/** Normalise text and keep, for every output char, the index of its source char. */
export function normalizeWithMap(input: string): Normalized {
  let text = "";
  const map: number[] = [];
  let lastWasSpace = true; // trims leading whitespace
  let i = 0;
  for (const ch of input) {
    const at = i;
    i += ch.length;
    const nfkc = ch.normalize("NFKC");
    for (const c of nfkc) {
      const mapped = QUOTE_CHARS[c] ?? c;
      if (/\s/u.test(mapped)) {
        if (!lastWasSpace) {
          text += " ";
          map.push(at);
          lastWasSpace = true;
        }
        continue;
      }
      text += mapped;
      map.push(at);
      lastWasSpace = false;
    }
  }
  if (text.endsWith(" ")) {
    text = text.slice(0, -1);
    map.pop();
  }
  return { text, map };
}

function cleanQuote(quote: string): string {
  const { text } = normalizeWithMap(quote);
  // Models sometimes wrap a quote in quotation marks; those aren't part of it.
  return text.replace(/^["']+|["']+$/g, "").trim();
}

/** Find a quote in the contract; returns original-text offsets (end exclusive) or null. */
export function locateQuote(contract: Normalized, original: string, quote: string, fromOriginal = 0): Span | null {
  const q = cleanQuote(quote);
  if (q.length < 8) return null; // too short to prove anything
  const fromNorm = contract.map.findIndex((orig) => orig >= fromOriginal);
  let idx = fromNorm >= 0 ? contract.text.indexOf(q, fromNorm) : -1;
  if (idx < 0) idx = contract.text.indexOf(q);
  if (idx < 0) return null;
  const start = contract.map[idx];
  const lastOrig = contract.map[idx + q.length - 1];
  const cp = original.codePointAt(lastOrig) ?? 0;
  const end = lastOrig + (cp > 0xffff ? 2 : 1);
  return { start, end };
}

export type VerifiedQuotes = {
  spans: (Span | null)[];
  hiddenCount: number;
};

/** Verify every clause quote in order; unverified clauses get null and are counted. */
export function verifyQuotes(contractText: string, quotes: string[]): VerifiedQuotes {
  const norm = normalizeWithMap(contractText);
  const spans: (Span | null)[] = [];
  let hiddenCount = 0;
  let cursor = 0;
  for (const quote of quotes) {
    const span = locateQuote(norm, contractText, quote, cursor);
    if (span) {
      cursor = span.start;
    } else {
      hiddenCount += 1;
    }
    spans.push(span);
  }
  return { spans, hiddenCount };
}
