import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { analyze } from "@/lib/analyze";
import { anonymize } from "@/lib/anonymize";
import type { SampleFile } from "@/lib/extraction";
import { findGutter, layoutPdfText, type PdfItem } from "@/lib/pdf-layout";
import { extractPdf, looksLikePdf, MAX_PDF_BYTES } from "@/lib/read-pdf";
import { checkInput } from "@/lib/validate";
import { verifyQuotes } from "@/lib/quotes";

const TODAY = "2026-10-24";
const read = (path: string) => new Uint8Array(readFileSync(path));
const sample = (id: string) => JSON.parse(readFileSync(`samples/${id}.json`, "utf8")) as SampleFile;
const flat = (s: string) => s.replace(/\s+/g, " ").trim();
const rows = (r: ReturnType<typeof analyze>) =>
  r.findings
    .filter((f) => f.verdict !== "INFO")
    .map((f) => `${f.ruleId} ${f.verdict}`)
    .sort();
// pdf.js runs in Node without a worker here; the app runs the same code in the browser with one.
const extract = (data: Uint8Array) => extractPdf(pdfjs as never, data);

describe("the three sample PDFs", () => {
  for (const id of ["traps-2025", "fair-2024", "reform-oct-2026"]) {
    test(`${id}: the PDF gives the same text, paragraphs and verdicts as the pasted sample`, async () => {
      const s = sample(id);
      const r = await extract(read(`public/samples/${id}.pdf`));
      if (!r.ok) throw new Error(r.error);
      expect(r.scannedPages).toBe(0);
      // Word for word the sample's text, without the page numbers of the PDF…
      expect(flat(r.text)).toBe(flat(s.text));
      expect(r.text).not.toMatch(/Página \d/);
      // …and one paragraph per clause, so the headings start their own line as in the pasted text.
      expect(r.text.split("\n\n").length).toBe(s.text.split(/\n\s*\n/).filter((p) => p.trim()).length);
      expect(r.text).toMatch(/^SEGUNDA\. /m);
      expect(checkInput(r.text).ok).toBe(true);
      // Same path as pasted text: anonymise, then the recorded reading's quotes must all be found.
      const fromPdf = analyze(anonymize(r.text).text, s.extraction, { today: TODAY });
      const fromPaste = analyze(anonymize(s.text).text, s.extraction, { today: TODAY });
      expect(fromPdf.hiddenCount).toBe(0);
      expect(rows(fromPdf)).toEqual(rows(fromPaste));
    });
  }
});

describe("awkward PDFs", () => {
  test("two columns written line by line across both columns read column by column, with the footer gone and the hyphen joined", async () => {
    const s = sample("fair-2024");
    const r = await extract(read("tests/fixtures/pdf/two-columns.pdf"));
    if (!r.ok) throw new Error(r.error);
    expect(r.pages).toBe(2);
    expect(flat(r.text)).toBe(flat(s.text));
    expect(r.text).not.toMatch(/vi-\s+vienda/);
    expect(r.text).not.toMatch(/Página \d/);
    // Same paragraphs as the pasted text: every clause heading opens its own paragraph.
    expect(r.text.split("\n\n").length).toBe(s.text.split(/\n\s*\n/).filter((p) => p.trim()).length);
    const fromPdf = analyze(anonymize(r.text).text, s.extraction, { today: TODAY });
    expect(fromPdf.hiddenCount).toBe(0);
  });

  test("a PDF saved from a browser, ragged-right with no space between paragraphs, keeps one paragraph per clause", async () => {
    const s = sample("reform-oct-2026");
    const r = await extract(read("tests/fixtures/pdf/no-spacing.pdf"));
    if (!r.ok) throw new Error(r.error);
    expect(flat(r.text)).toBe(flat(s.text));
    expect(r.text.split("\n\n")).toEqual(s.text.split(/\n\s*\n/).map(flat).filter(Boolean));
    expect(analyze(anonymize(r.text).text, s.extraction, { today: TODAY }).hiddenCount).toBe(0);
  });

  test("a printed contract, justified with bold clause headings, keeps every paragraph and every quote of the held-out labels", async () => {
    const src = readFileSync("eval/holdout/ho-2025-consumo.txt", "utf8");
    const r = await extract(read("tests/fixtures/pdf/printed.pdf"));
    if (!r.ok) throw new Error(r.error);
    expect(r.text.split("\n\n")).toEqual(src.split(/\n\s*\n/).map(flat).filter(Boolean));
    // Every literal passage the held-out labels anchor on is still found in the text read from the PDF.
    const gold = JSON.parse(readFileSync("eval/holdout/gold.json", "utf8")) as { contracts: Record<string, { units: { quotes: string[] }[] }> };
    const quotes = gold.contracts["ho-2025-consumo"].units.flatMap((u) => u.quotes);
    expect(verifyQuotes(anonymize(r.text).text, quotes).hiddenCount).toBe(0);
  });

  test("a scanned PDF (pictures of pages, no text layer) is refused, without promising OCR", async () => {
    const r = await extract(read("tests/fixtures/pdf/scanned.pdf"));
    expect(r).toEqual({ ok: false, error: "no_text", pages: 3 });
  });

  test("a password-protected PDF is refused with its own reason", async () => {
    const r = await extract(read("tests/fixtures/pdf/protected.pdf"));
    expect(r).toEqual({ ok: false, error: "password" });
  });

  test("a damaged PDF and a file that isn't a PDF are refused", async () => {
    expect(await extract(read("tests/fixtures/pdf/damaged.pdf"))).toMatchObject({ ok: false });
    const notPdf = new TextEncoder().encode("CONTRATO DE ARRENDAMIENTO DE VIVIENDA, pero en texto plano.");
    expect(looksLikePdf(notPdf)).toBe(false);
    expect(await extract(notPdf)).toEqual({ ok: false, error: "not_pdf" });
  });

  test("a file over the size limit is refused before pdf.js opens it", async () => {
    const big = new Uint8Array(MAX_PDF_BYTES + 1);
    big.set(new TextEncoder().encode("%PDF-1.7\n"));
    expect(await extract(big)).toEqual({ ok: false, error: "too_big" });
  });
});

describe("layout rules", () => {
  const line = (str: string, y: number, x = 72, w = 450): PdfItem => ({ str, x, y, w, h: 11 });

  test("headings start a paragraph even without extra spacing; an upper-case word that continues a sentence does not", () => {
    const text = layoutPdfText([
      {
        width: 595,
        height: 842,
        items: [
          line("De una parte, D. Javier Montero Salas, mayor de edad, en adelante EL", 700),
          line("ARRENDADOR.", 686, 72, 80),
          line("PRIMERA. OBJETO. El arrendador arrienda la vivienda descrita, que se destinará a", 672),
          line("vivienda habitual de la arrendataria.", 658, 72, 200),
          line("SEGUNDA. DURACIÓN. Un año.", 644, 72, 160),
        ],
      },
    ]);
    expect(text).toBe(
      "De una parte, D. Javier Montero Salas, mayor de edad, en adelante EL ARRENDADOR.\n\nPRIMERA. OBJETO. El arrendador arrienda la vivienda descrita, que se destinará a vivienda habitual de la arrendataria.\n\nSEGUNDA. DURACIÓN. Un año.",
    );
  });

  test("a paragraph broken across a page continues; running headers repeated on every page are dropped", () => {
    const header = (y: number) => ({ str: "Contrato de arrendamiento · Ref. 2025/114", x: 72, y, w: 250, h: 8 });
    const text = layoutPdfText([
      { width: 595, height: 842, items: [header(810), line("TERCERA. RENTA. La renta mensual se fija en mil euros, pagaderos dentro de los", 700)] },
      { width: 595, height: 842, items: [header(810), line("cinco primeros días de cada mes.", 700, 72, 180), { str: "2", x: 297, y: 30, w: 6, h: 8 }] },
    ]);
    expect(text).toBe("TERCERA. RENTA. La renta mensual se fija en mil euros, pagaderos dentro de los cinco primeros días de cada mes.");
  });

  test("justified single-column text has no gutter; two real columns do", () => {
    const single = Array.from({ length: 12 }, (_, i) => line(`línea ${i} de un párrafo justificado a todo lo ancho`, 700 - i * 14));
    expect(findGutter(single)).toBeNull();
    const two = Array.from({ length: 12 }, (_, i) => [line(`izquierda ${i}`, 700 - i * 14, 40, 240), line(`derecha ${i}`, 700 - i * 14, 310, 240)]).flat();
    expect(findGutter(two)).toBeGreaterThan(280);
    expect(findGutter(two)).toBeLessThan(310);
  });
});
