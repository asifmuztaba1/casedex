import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("serves the homepage and pricing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CaseDex/);
    const pricing = await page.goto("/pricing");
    expect(pricing?.status()).toBe(200);
  });

  test("answers unknown pages with a real 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("only lets search engines into public pages", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /");
    expect(robots).toContain("Allow: /pricing$");
  });

  test("never puts a password in the URL, even before the app has loaded", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("someone@example.test");
    await page.locator('input[name="password"]').fill("Secret#Leak2026");
    await Promise.all([page.waitForLoadState(), page.locator('button[type="submit"]').click()]);
    expect(page.url()).not.toContain("Secret");
    await context.close();
  });

  test("does not reload the page on a first visit while someone is typing", async ({ page }) => {
    // The service worker installs on the first visit; it used to trigger a reload
    // a moment later that wiped the form.
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Full name").fill("Nusrat Jahan");
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    await expect(page.getByLabel("Full name")).toHaveValue("Nusrat Jahan");
  });
});
