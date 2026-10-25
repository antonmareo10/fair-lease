import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import fair from "../samples/fair-2024.json";
import traps from "../samples/traps-2025.json";

const shot = (name: string, project: string) => `e2e/screenshots/${name}-${project}.png`;
const flat = (s: string) => s.replace(/\s+/g, " ").trim();

/** Counts calls to the live route; answers with a recorded reading so no API is used. */
async function watchRoute(page: Page, extraction: unknown) {
  const sent: string[] = [];
  await page.route("**/api/extract", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    sent.push(body.text);
    await new Promise((r) => setTimeout(r, 400));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, extraction, model: "claude-sonnet-5-5" }) });
  });
  return sent;
}

/** A real drag and drop of a file onto the start screen, as the browser fires it. */
async function dropFile(page: Page, path: string, name: string, type = "application/pdf") {
  const bytes = [...readFileSync(path)];
  const transfer = await page.evaluateHandle(
    ({ bytes, name, type }) => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(bytes)], name, { type }));
      return dt;
    },
    { bytes, name, type },
  );
  const box = page.getByLabel("Your contract text");
  await box.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(page.getByText("Drop the PDF to read it here")).toBeVisible();
  await box.dispatchEvent("dragover", { dataTransfer: transfer });
  await box.dispatchEvent("drop", { dataTransfer: transfer });
}

test("a dropped PDF is read on the device, shown in the box, and only its anonymised text is sent on Check", async ({ page }, info) => {
  const sent = await watchRoute(page, traps.extraction);
  await page.goto("/");
  await dropFile(page, "public/samples/traps-2025.pdf", "contrato-alquiler.pdf");

  const box = page.getByLabel("Your contract text");
  await expect(box).toHaveValue(/SEGUNDA\. DURACIÓN\. El contrato tendrá una duración/);
  expect(flat(await box.inputValue())).toBe(flat(traps.text));
  const status = page.getByRole("status").filter({ hasText: "contrato-alquiler.pdf" });
  await expect(status).toContainText("3 pages read on your device. Nothing has been sent yet.");
  expect(sent).toHaveLength(0);
  await page.screenshot({ path: shot("pdf-read", info.project.name) });

  await page.getByRole("button", { name: "Check my contract" }).click();
  await expect(page.getByText("Live check · contrato-alquiler.pdf · read by Claude Sonnet 5.5")).toBeVisible();
  await expect(page.getByText("10 not enforceable")).toBeVisible();
  expect(sent).toHaveLength(1);
  // Personal data never leaves the browser, whether the text was pasted or came from a PDF.
  expect(sent[0]).not.toMatch(/\d{8}[A-Z]/);
  expect(sent[0]).toContain("con DNI [DNI]");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("the upload button takes a two-column PDF and keeps the reading order", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("pdf-input").setInputFiles("tests/fixtures/pdf/two-columns.pdf");
  const box = page.getByLabel("Your contract text");
  await expect(box).toHaveValue(/SEGUNDA\. DURACIÓN\./);
  expect(flat(await box.inputValue())).toBe(flat(fair.text));
  await expect(page.getByRole("status").filter({ hasText: "two-columns.pdf" })).toContainText("2 pages read on your device");
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(box).toHaveValue("");
  await expect(page.getByRole("button", { name: "Check my contract" })).toBeDisabled();
});

test("a scanned PDF, a password-protected one and a file that isn't a PDF each get a clear message", async ({ page }, info) => {
  await page.goto("/");
  const input = page.getByTestId("pdf-input");
  const alert = page.locator("form [role=alert]");
  const box = page.getByLabel("Your contract text");

  await input.setInputFiles("tests/fixtures/pdf/scanned.pdf");
  await expect(alert).toContainText("This PDF is a scan");
  await expect(alert).toContainText("no OCR");
  await expect(box).toHaveValue("");
  await page.screenshot({ path: shot("pdf-scanned", info.project.name) });

  await input.setInputFiles("tests/fixtures/pdf/protected.pdf");
  await expect(alert).toContainText("password-protected");

  await input.setInputFiles({ name: "contrato.txt", mimeType: "text/plain", buffer: Buffer.from(traps.text) });
  await expect(alert).toContainText("That file isn't a PDF");
  await expect(box).toHaveValue("");
});

test("the traps sample PDF can be downloaded from the start screen", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "the traps contract as a PDF" });
  await expect(link).toHaveAttribute("href", "/samples/traps-2025.pdf");
  const res = await page.request.get("/samples/traps-2025.pdf");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});
