import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, asReturningUser } from "./support";

test.describe("platform admin console", () => {
  test.beforeEach(async ({ page }) => {
    await asReturningUser(page);
    await page.goto("/admin/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin(?!\/login)/);
  });

  test("creates an invite code with a sign-up link", async ({ page }) => {
    await page.goto("/admin/invites", { waitUntil: "networkidle" });
    await expect(page.getByRole("status").first()).toContainText(/Invite only|Open/);
    await page.getByLabel("For").fill("E2E admin check");
    const [created] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/v1/admin/invite-codes") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Create code" }).click(),
    ]);
    const code = (await created.json()).data.code as string;
    await expect(page.getByRole("row").filter({ hasText: code })).toContainText("E2E admin check");
  });

  test("shows which AI provider is in use", async ({ page }) => {
    await page.goto("/admin/ai", { waitUntil: "networkidle" });
    await expect(page.getByRole("status").first()).toContainText(/In use|No AI provider/);
    await expect(page.getByRole("region", { name: "Groq" })).toBeVisible();
  });
});
