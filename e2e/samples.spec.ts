import { expect, test } from "@playwright/test";

const shot = (name: string, project: string) => `e2e/screenshots/${name}-${project}.png`;

test("start screen says what it is and who it's for", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is your rental contract legal?");
  await expect(page.getByText("Made for people renting a home in Madrid")).toBeVisible();
  await page.screenshot({ path: shot("start", info.project.name), fullPage: true });
});

test("traps sample lights up with real verdicts", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /A contract full of traps \(2025\)/ }).click();
  const summary = page.getByRole("list", { name: "Summary" });
  await expect(summary).toContainText("10 not enforceable");
  await expect(summary).toContainText("2 worth checking");
  await expect(summary).toContainText("6 fine");
  await expect(page.getByRole("region", { name: "Which version of the law applies" })).toContainText("Signed 1 Sept 2025 → the May 2023 rules apply");
  await expect(page.getByText("Sample · hand-made extraction")).toBeVisible();
  // Every finding sits on a highlighted, verified quote: 18 clause entries in the sample.
  const clauses = await page.locator("mark.hl").evaluateAll((els) => new Set(els.map((e) => e.getAttribute("data-clause"))).size);
  expect(clauses).toBe(18);
  await expect(page.locator("mark.hl.v-ILLEGAL").first()).toBeVisible();
  await page.waitForTimeout(1800); // let the highlighter finish painting
  await page.screenshot({ path: shot("traps", info.project.name), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
