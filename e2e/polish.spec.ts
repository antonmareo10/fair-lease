import { expect, test } from "@playwright/test";

const shot = (name: string, project: string) => `e2e/screenshots/${name}-${project}.png`;
const noSideScroll = async (page: import("@playwright/test").Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

test("Write to my landlord lists the 10 changes and copies", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.goto("/");
  await page.getByRole("button", { name: /A contract full of traps/ }).click();
  await page.getByRole("button", { name: "Write to my landlord" }).click();
  const letter = page.getByRole("region", { name: "Message to your landlord" });
  await expect(letter).toContainText("Hola:");
  await expect(letter).toContainText("1. Cláusula segunda:");
  await expect(letter).toContainText("10. Cláusula undécima:");
  await expect(letter).toContainText("10 changes to ask for");
  await letter.getByRole("button", { name: "Copy the message" }).click();
  await expect(page.getByText("Copied")).toBeVisible();
  await letter.getByRole("button", { name: "EN" }).click();
  await expect(letter).toContainText("Hello,");
  await page.screenshot({ path: shot("letter", info.project.name) });
  await noSideScroll(page);
});

test("no landlord message when nothing is wrong", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /A fair contract/ }).click();
  await expect(page.getByText("No problems found in the 22 rules we check.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Write to my landlord" })).toHaveCount(0);
});

test("footer, privacy page, own icon, title and share image", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Fair Lease — Is your rental contract legal?");
  await expect(page.locator('link[rel="icon"][href*="icon.svg"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  const og = await request.get("/opengraph-image");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
  await page.getByRole("link", { name: "Privacy & Terms" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy & Terms");
  await expect(page.getByRole("heading", { name: "Your contract is not stored", level: 2 })).toBeVisible();
  await noSideScroll(page);
});

test("the logo on the privacy page leads back to the start", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByRole("link", { name: "Fair Lease, back to start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is your rental contract legal?");
});

test("keyboard focus is always visible", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "keyboard check on desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
});

test.describe("dark mode and reduced motion", () => {
  test.use({ colorScheme: "dark", reducedMotion: "reduce" });
  test("result is legible in dark mode and painted without animation", async ({ page }, info) => {
    await page.goto("/");
    await page.screenshot({ path: shot("start-dark", info.project.name) });
    await page.getByRole("button", { name: /A contract full of traps/ }).click();
    const size = await page.locator("mark.hl").first().evaluate((el) => getComputedStyle(el).backgroundSize);
    expect(size.startsWith("100%")).toBe(true);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(20, 19, 18)");
    await page.screenshot({ path: shot("traps-dark", info.project.name) });
    await noSideScroll(page);
  });
});
