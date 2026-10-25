// Builds two PDF fixtures "saved as PDF" from Chrome, the way many people make a PDF (tests/fixtures/pdf/):
// - no-spacing.pdf  the reform sample, ragged-right, NO space between paragraphs, a page-number footer
// - printed.pdf     held-out contract H3, justified, bold clause headings, a little space after each paragraph
// Run once: node scripts/make-pdf-fixture-chrome.mjs (uses the Playwright Chromium the e2e tests use).
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const paragraphs = (text) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
const footer = '<div style="font-size:8pt;width:100%;text-align:center">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>';

const plain = paragraphs(JSON.parse(readFileSync("samples/reform-oct-2026.json", "utf8")).text)
  .map((p) => `<p>${escape(p.replace(/\s+/g, " "))}</p>`)
  .join("\n");

const printed = paragraphs(readFileSync("eval/holdout/ho-2025-consumo.txt", "utf8"))
  .map((p) => {
    const t = escape(p.replace(/[ \t]+/g, " "));
    const heading = /^((?:[A-ZÁÉÍÓÚÜÑ]+ ?)+\.(?: [A-ZÁÉÍÓÚÜÑ ,]+\.)?)( .*)$/.exec(t);
    if (/ {3,}/.test(p)) return `<p class="sig">${p.split(/ {3,}/).map((s) => `<span>${escape(s)}</span>`).join("")}</p>`;
    return heading ? `<p><b>${heading[1]}</b>${heading[2]}</p>` : `<p>${t}</p>`;
  })
  .join("\n");

const docs = [
  {
    path: "tests/fixtures/pdf/no-spacing.pdf",
    css: "body { font: 11pt/1.35 Arial, sans-serif; margin: 0; } p { margin: 0; text-align: left; }",
    body: plain,
  },
  {
    path: "tests/fixtures/pdf/printed.pdf",
    css: 'body { font: 11.5pt/1.5 "Times New Roman", serif; margin: 0; } p { margin: 0 0 8pt; text-align: justify; } .sig { display: flex; justify-content: space-between; margin-top: 40pt; }',
    body: printed,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const d of docs) {
  await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${d.css}</style></head><body>${d.body}</body></html>`);
  await page.pdf({
    path: d.path,
    format: "A4",
    margin: { top: "28mm", bottom: "24mm", left: "25mm", right: "25mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: footer,
  });
  console.log(d.path);
}
await browser.close();
