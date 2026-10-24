import { expect, test } from "@playwright/test";
import traps from "../samples/traps-2025.json";

/**
 * Real end-to-end checks against the live route and the real API (costs a few cents).
 * Skipped unless FL_REAL_LIVE=1 and the server has ANTHROPIC_API_KEY in .env.local.
 */
test.skip(!process.env.FL_REAL_LIVE, "set FL_REAL_LIVE=1 to call the real API");
test.describe.configure({ mode: "serial" });

test("real live check of a pasted contract", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one real call is enough");
  test.setTimeout(120_000);
  // An edited contract, not identical to the sample: different rent, an email, no agency clause.
  const edited = traps.text
    .replace("MIL CIENTO CINCUENTA EUROS (1.150 €)", "MIL DOSCIENTOS EUROS (1.200 €)")
    .replace("por importe de 3.450 €", "por importe de 3.600 €")
    .replace("en adelante EL ARRENDADOR.", "con correo javier.montero@example.es, en adelante EL ARRENDADOR.");
  await page.goto("/");
  await page.getByLabel("Your contract text").fill(edited);
  await page.getByRole("button", { name: "Check my contract" }).click();
  await expect(page.getByRole("region", { name: "Checking your contract" })).toContainText("1 email");
  await expect(page.getByText("Live check · read by Claude Sonnet 5.5")).toBeVisible({ timeout: 90_000 });
  const summary = page.getByRole("list", { name: "Summary" });
  await expect(summary).toContainText("not enforceable");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "e2e/screenshots/real-live-desktop.png", fullPage: true });
  await expect(page.locator(".sheet").first()).toContainText("[EMAIL]");
});

test("real live check of something that isn't a contract", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one real call is enough");
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByLabel("Your contract text").fill(
    "Dear tenants, this is a reminder that the building's lift will be under maintenance next week. Please use the stairs and keep the entrance clear. ".repeat(4),
  );
  await page.getByRole("button", { name: "Check my contract" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("doesn't look like a Spanish rental contract", { timeout: 90_000 });
});
