import { expect, test, type Page } from "@playwright/test";
import { adminApi, apiPost, asReturningUser, dismissOverlays, firstLink, signIn, uniqueEmail, waitForEmail } from "./support";

/**
 * One firm's life in CaseDex, through the real UI: invite → sign-up → email
 * verification → workspace → case → hearing → document → export → delete
 * account (and change of mind). Steps share state, so they run in order.
 */
test.describe.configure({ mode: "serial" });

const email = uniqueEmail("e2e-lawyer");
const password = "E2e#Lawyer2026pass";
let page: Page;
let casePath = "";

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await asReturningUser(page);
});

test.afterAll(async () => {
  await page.close();
});

test("a new firm signs up with an invite link and verifies its email", async () => {
  const admin = await adminApi();
  const invite = await apiPost(admin, "/api/v1/admin/invite-codes", { label: "E2E firm", max_uses: 1, expires_in_days: 1 });
  expect(invite.status()).toBe(201);
  const signupUrl = new URL((await invite.json()).data.signup_url);

  await page.goto(`${signupUrl.pathname}${signupUrl.search}`, { waitUntil: "networkidle" });
  await expect(page.getByLabel("Invite code")).toHaveValue(signupUrl.searchParams.get("invite") ?? "");
  await page.getByLabel("Full name").fill("Nusrat Jahan");
  await page.getByLabel("Work email").fill(email);
  const bangladesh = await page.locator("#register-country option", { hasText: "Bangladesh" }).first().getAttribute("value");
  await page.getByLabel("Country").selectOption(bangladesh ?? "");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/onboarding\/account/);

  const verification = await waitForEmail(email, "Verify your CaseDex");
  await page.goto(firstLink(verification, "verify-email"));
  await page.waitForURL(/onboarding\/workspace/);
});

test("creates the workspace and starts the trial", async () => {
  await expect(page.getByLabel("Workspace name")).not.toHaveValue("");
  await page.getByLabel("Workspace name").fill("Jahan Chambers");
  await page.getByRole("button", { name: "Start free trial" }).click();
  await page.waitForURL(/dashboard/);
  await dismissOverlays(page);
});

test("opens a case with the wizard", async () => {
  await page.goto("/cases/new", { waitUntil: "networkidle" });
  await page.getByLabel("Plaintiff (বাদী)").fill("Salma Begum");
  await page.getByLabel("Defendant (বিবাদী)").fill("Kamal Hossain");
  await page.getByLabel("Defendant's lawyer name").fill("Advocate Rahim Uddin");
  await page.getByLabel("Next hearing date").fill("2026-11-20T10:00");
  // The court is picked from the list, like a user would.
  await page.getByRole("button", { name: "Open court list" }).click();
  await page.getByPlaceholder("Search courts or districts").fill("High Court");
  await page.getByRole("button", { name: /High Court Division/ }).first().click();
  await page.getByRole("button", { name: "Create case" }).first().click();
  await page.waitForURL(/\/cases\/[0-9A-Z]{26}$/);
  casePath = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Salma Begum");
});

test("adds a hearing and uploads a document to the case", async () => {
  await dismissOverlays(page);
  await page.getByRole("button", { name: "Add hearing" }).first().click();
  const hearingSheet = page.getByRole("dialog");
  await hearingSheet.locator('input[type="datetime-local"]').fill("2026-12-07T10:30");
  await hearingSheet.getByPlaceholder("Agenda").fill("First mention before the court");
  await hearingSheet.getByRole("button", { name: "Add hearing" }).click();
  await expect(hearingSheet).toBeHidden();
  // Overview shows only the next hearing (the wizard's); the new one is on the Hearings tab.
  await page.getByRole("tab", { name: /hearings/i }).click();
  await expect(page.getByText("First mention before the court").first()).toBeVisible();

  await page.getByRole("button", { name: "Upload document" }).first().click();
  const documentSheet = page.getByRole("dialog");
  await documentSheet.locator('input[type="file"]').setInputFiles("e2e/fixtures/vakalatnama.pdf");
  await documentSheet.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(documentSheet).toBeHidden();
  await page.getByRole("tab", { name: /documents/i }).click();
  await expect(page.getByText("vakalatnama.pdf").first()).toBeVisible();
});

test("exports the whole workspace as a zip", async () => {
  await page.goto("/settings", { waitUntil: "networkidle" });
  await dismissOverlays(page);
  const card = page.getByText("Export workspace data", { exact: true }).locator("xpath=ancestor::div[contains(@class,'border')][1]");
  await card.getByRole("button", { name: "Email me an export" }).click();
  const download = card.getByRole("link", { name: "Download" }).first();
  await expect(download).toBeVisible({ timeout: 60_000 });

  const response = await page.request.get((await download.getAttribute("href")) ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("zip");
});

test("deletes the account, then keeps it by signing in again", async () => {
  const card = page.getByText("Delete account", { exact: true }).locator("xpath=ancestor::div[contains(@class,'border')][1]");
  await expect(card).toContainText("last member of this workspace");
  await card.getByLabel("Your password").fill(password);
  await card.getByLabel("I understand my account will be deleted").check();
  await card.getByRole("button", { name: "Delete my account" }).click();
  await page.waitForURL(/login\?account_deleted=1/);
  await expect(page.getByRole("status")).toContainText("scheduled for deletion");

  // Signed out everywhere: the case is no longer reachable.
  await page.goto(casePath);
  await page.waitForURL(/login/);

  await signIn(page, email, password);
  await expect(page.getByText("Welcome back. Your account will not be deleted.", { exact: true })).toBeVisible();
});
