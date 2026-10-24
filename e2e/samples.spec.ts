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
  await expect(page.getByText(/Sample · recorded extraction \(Claude Opus 5\.5/)).toBeVisible();
  // Every finding sits on a highlighted, verified quote.
  const clauses = await page.locator("mark.hl").evaluateAll((els) => new Set(els.map((e) => e.getAttribute("data-clause"))).size);
  expect(clauses).toBeGreaterThanOrEqual(16);
  await expect(page.locator("mark.hl.v-ILLEGAL").first()).toBeVisible();
  await page.waitForTimeout(1800); // let the highlighter finish painting
  await page.screenshot({ path: shot("traps", info.project.name), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

// The star moment, a clause lit up with its note, must be on the first screen, next to the numbers: no scrolling to find it.
const OPENINGS = [
  { name: "traps", button: /A contract full of traps \(2025\)/ },
  { name: "fair", button: /A fair contract \(2024\)/ },
  { name: "reform", button: /Signed after the Oct 2026 reform/ },
];

for (const sample of OPENINGS) {
  test(`${sample.name} sample: the first highlight is on the first screen`, async ({ page }, info) => {
    await page.goto("/");
    await page.getByRole("button", { name: sample.button }).click();
    await expect(page.getByRole("list", { name: "Summary" })).toBeVisible();
    await page.waitForTimeout(400); // the margin notes settle after the first layout pass

    const view = await page.evaluate(() => {
      const mark = document.querySelector("mark.hl");
      const lines = mark ? [...mark.getClientRects()] : [];
      const note = document.querySelector<HTMLElement>("[data-group]");
      const summary = document.querySelector('[aria-label="Summary"]');
      const rect = (r: DOMRect | undefined) => (r ? { top: r.top, bottom: r.bottom } : null);
      return {
        scrollY: window.scrollY,
        height: window.innerHeight,
        firstLine: rect(lines[0]),
        note: rect(note?.getBoundingClientRect()),
        summary: rect(summary?.getBoundingClientRect()),
      };
    });

    // Nothing scrolled the page: this is the screen the person lands on.
    expect(view.scrollY).toBe(0);
    expect(view.summary).not.toBeNull();
    expect(view.summary!.bottom).toBeLessThan(view.height);
    // The first line of the first highlight is fully inside the first screen, with room for a few more lines under it.
    expect(view.firstLine).not.toBeNull();
    expect(view.firstLine!.top).toBeGreaterThanOrEqual(0);
    expect(view.firstLine!.bottom).toBeLessThanOrEqual(view.height - 60);
    if (info.project.name === "desktop") {
      // Desktop: its margin note is there too, whole.
      expect(view.note).not.toBeNull();
      expect(view.note!.top).toBeGreaterThanOrEqual(0);
      expect(view.note!.bottom).toBeLessThanOrEqual(view.height);
    }
  });
}

test("the unmarked opening is folded, can be opened, and keeps its words", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /A contract full of traps \(2025\)/ }).click();
  const fold = page.locator("details.fold");
  await expect(fold).toHaveCount(1);
  await expect(fold).not.toHaveAttribute("open", "");
  await expect(fold.locator("summary")).toContainText("Show the opening");
  await expect(page.getByText("De una parte, D. Javier Montero Salas")).toBeHidden();
  const before = await page.locator("mark.hl").first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await fold.locator("summary").click();
  await expect(fold.locator("summary")).toContainText("Hide the opening");
  await expect(page.getByText("De una parte, D. Javier Montero Salas")).toBeVisible();
  const after = await page.locator("mark.hl").first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(after).toBeGreaterThan(before + 200);
  // It is a real disclosure: the keyboard works.
  await fold.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(fold).not.toHaveAttribute("open", "");
});

test("an opening with highlights in it is not folded", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Signed after the Oct 2026 reform/ }).click();
  await expect(page.locator("details.fold")).toHaveCount(0);
  await expect(page.locator("mark.hl").first()).toContainText("CONTRATO DE ARRENDAMIENTO POR TEMPORADA");
});
