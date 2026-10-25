// Builds tests/fixtures/pdf/no-spacing.pdf: the reform sample "saved as PDF" from Chrome, the way many
// people make a PDF, with ragged-right paragraphs and NO space between them, plus a page-number footer.
// Run once: node scripts/make-pdf-fixture-chrome.mjs (uses the Playwright Chromium the e2e tests use).
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const sample = JSON.parse(readFileSync("samples/reform-oct-2026.json", "utf8"));
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const paragraphs = sample.text
  .split(/\n\s*\n/)
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => `<p>${escape(p.replace(/\s+/g, " "))}</p>`)
  .join("\n");

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  body { font: 11pt/1.35 Arial, sans-serif; margin: 0; }
  p { margin: 0; text-align: left; }
</style></head><body>${paragraphs}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({
  path: "tests/fixtures/pdf/no-spacing.pdf",
  format: "A4",
  margin: { top: "28mm", bottom: "24mm", left: "25mm", right: "25mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: '<div style="font-size:8pt;width:100%;text-align:center">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
});
await browser.close();
console.log("tests/fixtures/pdf/no-spacing.pdf");
