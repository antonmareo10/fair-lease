import { describe, expect, it } from "vitest";
import { normalizeWithMap, verifyQuotes } from "@/lib/quotes";

const contract = "QUINTA. FIANZA.  La fianza será devuelta en el plazo de tres (3) meses,\ny no devengará interés alguno. Cláusula «especial» – fin.";

describe("Quote Verifier", () => {
  it("finds an exact quote and returns original offsets", () => {
    const quote = "La fianza será devuelta en el plazo de tres (3) meses";
    const { spans, hiddenCount } = verifyQuotes(contract, [quote]);
    expect(hiddenCount).toBe(0);
    const s = spans[0]!;
    expect(contract.slice(s.start, s.end)).toBe(quote);
  });

  it("forgives whitespace runs, line breaks and curly quotes / dashes", () => {
    const quote = 'tres (3) meses, y no devengará interés alguno. Cláusula "especial" - fin.';
    const { spans } = verifyQuotes(contract, [quote]);
    const s = spans[0]!;
    expect(contract.slice(s.start, s.end)).toBe("tres (3) meses,\ny no devengará interés alguno. Cláusula «especial» – fin.");
  });

  it("strips quotation marks the model wraps around a quote", () => {
    const { hiddenCount } = verifyQuotes(contract, ["“La fianza será devuelta”"]);
    expect(hiddenCount).toBe(0);
  });

  it("drops paraphrases, ellipses and case changes", () => {
    const { spans, hiddenCount } = verifyQuotes(contract, [
      "La fianza se devolverá en tres meses",
      "La fianza será devuelta [...] interés alguno",
      "la fianza será devuelta en el plazo",
    ]);
    expect(spans).toEqual([null, null, null]);
    expect(hiddenCount).toBe(3);
  });

  it("drops quotes too short to prove anything", () => {
    expect(verifyQuotes(contract, ["fianza"]).hiddenCount).toBe(1);
  });

  it("prefers the occurrence after the previous clause", () => {
    const text = "Se paga en metálico. Otra cosa. Se paga en metálico.";
    const { spans } = verifyQuotes(text, ["Otra cosa.", "Se paga en metálico."]);
    expect(spans[1]!.start).toBe(text.lastIndexOf("Se paga"));
  });

  it("maps NFKC-expanded characters back to the source", () => {
    const n = normalizeWithMap("a  b");
    expect(n.text).toBe("a b");
    expect(n.map).toEqual([0, 1, 3]);
  });
});
