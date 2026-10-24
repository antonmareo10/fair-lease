import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import { buildSegments, type Segment } from "@/lib/segments";
import { findFold, splitAtFold } from "@/lib/fold";
import type { SampleFile } from "@/lib/extraction";
import { fair, reform, traps } from "./fixtures";

function segmentsOf(sample: SampleFile) {
  const result = analyze(sample.text, sample.extraction, { today: "2026-10-24" });
  return buildSegments(sample.text, result.spans, result.findings);
}

describe("Fold of the unmarked opening", () => {
  it("folds the opening of the traps contract and keeps the title and the first marked clause", () => {
    const segments = segmentsOf(traps as SampleFile);
    const text = (traps as SampleFile).text;
    const fold = findFold(text, segments)!;
    expect(fold).not.toBeNull();
    const first = segments.find((s) => s.top)!;
    // Ends at the start of the paragraph that holds the first highlight, never inside a highlight.
    expect(fold.to).toBeLessThanOrEqual(first.start);
    expect(text.slice(fold.to, first.start)).not.toContain("\n");
    expect(text.slice(fold.to).startsWith("SEGUNDA.")).toBe(true);
    // The title stays out of the fold.
    expect(text.slice(0, fold.from)).toContain("CONTRATO DE ARRENDAMIENTO DE VIVIENDA");
    expect(text.slice(fold.from, fold.to)).toContain("REUNIDOS");
  });

  it("never folds a highlight", () => {
    for (const sample of [traps, fair]) {
      const segments = segmentsOf(sample as SampleFile);
      const fold = findFold((sample as SampleFile).text, segments)!;
      expect(fold).not.toBeNull();
      const parts = splitAtFold((sample as SampleFile).text, segments, fold);
      expect(parts.folded.every((s) => !s.top)).toBe(true);
      expect(parts.head.every((s) => !s.top)).toBe(true);
    }
  });

  it("keeps every character of the contract, whitespace aside", () => {
    const sample = fair as SampleFile;
    const segments = segmentsOf(sample);
    const fold = findFold(sample.text, segments)!;
    const parts = splitAtFold(sample.text, segments, fold);
    const rebuilt = [...parts.head, ...parts.folded, ...parts.tail].map((s: Segment) => sample.text.slice(s.start, s.end)).join("");
    expect(rebuilt.replace(/\s+/g, "")).toBe(sample.text.replace(/\s+/g, ""));
  });

  it("does not fold when the text opens with a highlight", () => {
    const sample = reform as SampleFile;
    expect(findFold(sample.text, segmentsOf(sample))).toBeNull();
  });

  it("does not fold a short opening, nor a contract with nothing highlighted", () => {
    const text = "CONTRATO DE ARRENDAMIENTO\n\nEn Madrid.\n\nPRIMERA. OBJETO. Una frase marcada.";
    const start = text.indexOf("Una frase");
    const segments = buildSegments(text, [{ start, end: text.length }], [
      { id: "x", ruleId: "FL-00", verdict: "ILLEGAL", clauseIndices: [0], title: "t" } as never,
    ]);
    expect(findFold(text, segments)).toBeNull();
    expect(findFold(text, buildSegments(text, [], []))).toBeNull();
  });
});
