import { expect, test } from "@playwright/test";

const shot = (name: string, project: string) => `e2e/screenshots/${name}-${project}.png`;

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.goto("/");
  await page.getByRole("button", { name: /A contract full of traps \(2025\)/ }).click();
});

test("money line comes from the contract's own numbers", async ({ page }) => {
  await expect(page.getByText(/ties up €11,741.50 \(cash plus a bank guarantee\)/)).toBeVisible();
  await expect(page.getByText("The legal maximum is", { exact: false })).toContainText("€4,600");
  await expect(page.getByText("That's €7,141.50 more than the law allows.")).toBeVisible();
});

test("clause QUINTA opens three stacked findings, not enforceable first", async ({ page }, info) => {
  const phone = info.project.name === "phone";
  // Click the bank-guarantee highlight.
  await page.locator("mark.hl", { hasText: "aval bancario" }).first().click();
  const container = phone ? page.getByRole("dialog") : page.locator('[data-group="QUINTA"]');
  await expect(container).toBeVisible();
  const findings = container.locator("[data-finding]");
  await expect(findings).toHaveCount(3);
  await expect(findings.nth(0)).toContainText("Not enforceable");
  await expect(findings.nth(0)).toContainText("Extra guarantees above the legal limit");
  await expect(findings.nth(0)).toContainText("5 months of guarantees · €3,450 over the limit");
  await expect(findings.nth(1)).toContainText("Worth checking");
  await expect(findings.nth(2)).toContainText("Worth checking");

  // The law, with its BOE link.
  await findings.nth(0).getByText(/What the law says · LAU art\. 36\.5/).click();
  await expect(findings.nth(0).getByRole("link", { name: /Open in the BOE/ })).toHaveAttribute("href", /BOE-A-1994-26003#a36/);

  // Ask for this instead: ES by default, copy works.
  await expect(findings.nth(0)).toContainText("Las garantías adicionales suman 5 meses");
  await findings.nth(0).getByRole("button", { name: "Copy in Spanish" }).click();
  await expect(page.getByText("Copied")).toBeVisible();
  await findings.nth(0).getByRole("button", { name: "EN" }).click();
  await expect(findings.nth(0)).toContainText("The extra guarantees add up to 5 months");

  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("finding-open", info.project.name), fullPage: !phone });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("a counter jumps to the first finding of its kind", async ({ page }, info) => {
  const counter = page.getByRole("list", { name: "Summary" }).getByRole("button", { name: /not enforceable/ });
  await counter.click();
  if (info.project.name === "phone") {
    await expect(page.getByRole("dialog")).toContainText("Says you can't stay past the first term");
  } else {
    const first = page.locator('[data-group="SEGUNDA"]');
    await expect(first).toHaveAttribute("data-active", "true");
    await expect(first).toBeInViewport();
  }
});

test("count mark shows where two findings share the same words", async ({ page }) => {
  const cuarta = page.locator("mark.hl", { hasText: "cada seis (6) meses" });
  await expect(cuarta.locator(".hl-count")).toHaveText("2");
  await expect(cuarta).toHaveClass(/v-ILLEGAL/);
});

test("J and K move between findings", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "keyboard shortcuts are a desktop feature");
  await page.locator("body").press("j");
  await expect(page.locator('[data-group="SEGUNDA"]')).toHaveAttribute("data-active", "true");
  await page.locator("body").press("j");
  await expect(page.locator('[data-group="TERCERA"]')).toHaveAttribute("data-active", "true");
  await page.locator("body").press("k");
  await expect(page.locator('[data-group="SEGUNDA"]')).toHaveAttribute("data-active", "true");
});

test("margin notes don't overlap", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "desktop margin only");
  await page.waitForTimeout(600);
  const boxes = await page.locator("[data-group]").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: r.top, bottom: r.bottom })));
  boxes.sort((a, b) => a.top - b.top);
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 0.5);
});
