import { expect, test, type Page } from "@playwright/test";
import fair from "../samples/fair-2024.json";
import traps from "../samples/traps-2025.json";

const shot = (name: string, project: string) => `e2e/screenshots/${name}-${project}.png`;

async function mockRoute(page: Page, body: unknown, status = 200, delay = 600) {
  await page.route("**/api/extract", async (route) => {
    const sent = JSON.parse(route.request().postData() ?? "{}");
    // The browser must never send the raw personal data.
    if (/\d{8}[A-Z]/.test(sent.text)) return route.fulfill({ status: 500, body: "raw DNI leaked" });
    await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("Check is disabled until something is pasted; short text explains why", async ({ page }) => {
  await page.goto("/");
  const check = page.getByRole("button", { name: "Check my contract" });
  await expect(check).toBeDisabled();
  await page.getByLabel("Your contract text").fill("Contrato de alquiler de un piso en Madrid.");
  await expect(check).toBeEnabled();
  await check.click();
  await expect(page.locator("form [role=alert]")).toContainText("too short to be a rental contract");
});

test("a pasted contract is anonymised, checked live and annotated", async ({ page }, info) => {
  await mockRoute(page, { ok: true, extraction: fair.extraction, model: "claude-sonnet-5-5" });
  await page.goto("/");
  await page.getByLabel("Your contract text").fill(fair.text);
  await page.getByRole("button", { name: "Check my contract" }).click();
  const steps = page.getByRole("region", { name: "Checking your contract" });
  await expect(steps).toContainText("Removing personal data");
  await expect(steps).toContainText("2 removed: 2 ID numbers (DNI)");
  await page.screenshot({ path: shot("checking", info.project.name) });
  await expect(page.getByText("Live check · read by Claude Sonnet 5.5")).toBeVisible();
  await expect(page.getByText("No problems found in the 18 rules we check.")).toBeVisible();
  await expect(page.getByText("Removed before analysis: 2 ID numbers (DNI).")).toBeVisible();
  await expect(page.locator(".sheet").first()).toContainText("con DNI [DNI]");
});

test("when live checks are paused, it says so and offers the samples", async ({ page }) => {
  await mockRoute(page, { ok: false, error: "unavailable" }, 503, 100);
  await page.goto("/");
  await page.getByLabel("Your contract text").fill(traps.text);
  await page.getByRole("button", { name: "Check my contract" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Live checks are paused right now. The samples still work.");
  await expect(page.getByLabel("Your contract text")).toHaveValue(traps.text);
  await expect(page.getByRole("button", { name: /A contract full of traps/ })).toBeVisible();
});

test("text that isn't a Spanish rental contract gets a clear message", async ({ page }) => {
  await mockRoute(page, { ok: false, error: "not_a_contract" }, 422, 100);
  await page.goto("/");
  await page.getByLabel("Your contract text").fill("This is an English lease agreement. ".repeat(20));
  await page.getByRole("button", { name: "Check my contract" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("doesn't look like a Spanish rental contract");
});

test("no signing date: today's law, and picking a date re-runs the rules", async ({ page }, info) => {
  const undated = { ...traps.extraction, facts: { ...traps.extraction.facts, signing_date: null } };
  await mockRoute(page, { ok: true, extraction: undated, model: "claude-sonnet-5-5" }, 200, 100);
  await page.goto("/");
  await page.getByLabel("Your contract text").fill(traps.text);
  await page.getByRole("button", { name: "Check my contract" }).click();
  const law = page.getByRole("region", { name: "Which version of the law applies" });
  await expect(law).toContainText("No signing date found: checked against the law in force today");
  await expect(law).toContainText("the 8 Oct 2026 reform applies");
  await expect(page.locator("mark.hl", { hasText: "renuncia expresamente a los derechos de tanteo" })).toHaveClass(/v-ILLEGAL/);
  await law.getByLabel("Signed on another date?").fill("2025-09-01");
  await expect(law).toContainText("You picked 1 Sept 2025 → the May 2023 rules apply");
  await expect(page.locator("mark.hl", { hasText: "renuncia expresamente a los derechos de tanteo" })).toHaveClass(/v-OK/);
  await page.screenshot({ path: shot("picked-date", info.project.name) });
});
