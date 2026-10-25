import { expect, test } from "@playwright/test";

const shot = (name: string, project: string) => `e2e/screenshots/${name}-${project}.png`;
const law = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Which version of the law applies" });

test("reform sample: Oct 2026 law, pending tags, waiver flips to red", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Signed after the Oct 2026 reform/ }).click();
  await expect(law(page)).toContainText("Signed 12 Oct 2026 → the 8 Oct 2026 reform applies (pending Congress vote)");
  await expect(page.getByRole("list", { name: "Summary" })).toContainText("5 not enforceable");
  await expect(page.getByText("The 8 Oct 2026 changes still need a vote in Congress.")).toBeVisible();
  const waiver = page.locator("mark.hl", { hasText: "renuncia expresamente a los derechos de tanteo" });
  await expect(waiver).toHaveClass(/v-ILLEGAL/);
  await waiver.click();
  const box = info.project.name === "phone" ? page.getByRole("dialog") : page.locator('[data-group="OCTAVA"]');
  await expect(box).toContainText("New since 8 Oct 2026 · pending Congress vote");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: shot("reform", info.project.name), fullPage: info.project.name !== "phone" });
});

test("traps sample: the same waiver is fine in 2025", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /A contract full of traps/ }).click();
  await expect(page.locator("mark.hl", { hasText: "renuncia expresamente a los derechos de tanteo" })).toHaveClass(/v-OK/);
});

test("fair sample: clean, green, not alarmist", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /A fair contract \(2024\)/ }).click();
  await expect(page.getByText("No problems found in the 22 rules we check.")).toBeVisible();
  await expect(law(page)).toContainText("Signed 15 Feb 2024 → the May 2023 rules apply");
  await expect(page.getByText(/ties up/)).toHaveCount(0);
  await expect(page.locator("mark.hl.v-ILLEGAL")).toHaveCount(0);
  await expect(page.getByText(/not legal advice/)).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: shot("fair", info.project.name), fullPage: true });
});
