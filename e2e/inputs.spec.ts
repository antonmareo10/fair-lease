import { expect, test } from "@playwright/test";

test("very long input is refused with a reason before anything is sent", async ({ page }) => {
  let called = false;
  await page.route("**/api/extract", (r) => ((called = true), r.abort()));
  await page.goto("/");
  await page.getByLabel("Your contract text").fill("Cláusula. ".repeat(6500));
  await page.getByRole("button", { name: "Check my contract" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("longer than a rental contract usually is");
  expect(called).toBe(false);
});

test("on a phone the samples are one tap away from the first screen", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone layout only");
  await page.goto("/");
  const jump = page.getByRole("link", { name: "Or try a sample ↓" });
  await expect(jump).toBeInViewport();
  await jump.click();
  await expect(page.getByRole("button", { name: /A contract full of traps/ })).toBeInViewport();
});
