import { expect, type APIRequestContext, type Page, request } from "@playwright/test";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
export const MAILHOG_URL = process.env.E2E_MAILHOG_URL ?? "http://localhost:8025";
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.test";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "E2e#Admin2026pass";

export function uniqueEmail(prefix: string): string {
  return `${prefix}+${Date.now()}${Math.floor(Math.random() * 1000)}@example.test`;
}

/** Signs in through the real login form and waits for the redirect. */
export async function signIn(page: Page, email: string, password: string, landing: RegExp = /dashboard/) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(landing);
}

/**
 * Start like a returning user: the welcome tour, cookie note, language picker,
 * morning greeting and spoken page guide are first-visit extras, not what these
 * tests check, and they open on timers over whatever the test is clicking.
 */
export async function asReturningUser(page: Page) {
  await page.addInitScript(() => {
    const today = new Date();
    const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const seen: Record<string, string> = {
      "casedex-cookie-consent": "accepted",
      casedex_tour_completed: "true",
      casedex_lang_picker_shown: "true",
      casedex_assistant_enabled: "false",
      casedex_assistant_tip_dismissed: "true",
      [`casedex_briefing_shown_${day}`]: "true",
    };
    for (const [key, value] of Object.entries(seen)) {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value);
    }
  });
}

/** Closes first-visit overlays (cookie note, morning briefing) that cover the page. */
export async function dismissOverlays(page: Page) {
  // The tour modal sits above the cookie note, so close it first.
  for (const name of ["Skip tour", "Got it"]) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.count()) await button.first().click({ timeout: 3_000 }).catch(() => {});
  }
}

/** An API session as the platform admin, for setup the UI test doesn't cover. */
export async function adminApi(): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Accept: "application/json", Origin: BASE_URL, Referer: `${BASE_URL}/` } });
  await api.get("/sanctum/csrf-cookie");
  const xsrf = decodeURIComponent((await api.storageState()).cookies.find((c) => c.name === "XSRF-TOKEN")?.value ?? "");
  const login = await api.post("/api/v1/auth/login", { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, headers: { "X-XSRF-TOKEN": xsrf } });
  expect(login.status(), "platform admin sign-in").toBe(200);
  return api;
}

export async function apiPost(api: APIRequestContext, path: string, data: unknown) {
  const xsrf = decodeURIComponent((await api.storageState()).cookies.find((c) => c.name === "XSRF-TOKEN")?.value ?? "");
  return api.post(path, { data, headers: { "X-XSRF-TOKEN": xsrf } });
}

/** Waits for an email to arrive in Mailhog and returns its decoded HTML body. */
export async function waitForEmail(to: string, subjectContains: string): Promise<string> {
  const mail = await request.newContext();
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await mail.get(`${MAILHOG_URL}/api/v2/search?kind=to&query=${encodeURIComponent(to)}`);
    const items = (await res.json()).items as { Content: { Headers: Record<string, string[]>; Body: string } }[];
    const match = items.find((item) => decodeHeader(item.Content.Headers.Subject?.[0] ?? "").includes(subjectContains));
    if (match) return decodeQuotedPrintable(match.Content.Body);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`No "${subjectContains}" email for ${to}`);
}

export function firstLink(html: string, contains: string): string {
  const link = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).find((href) => href.includes(contains));
  if (!link) throw new Error(`No link containing ${contains}`);
  return link;
}

function decodeQuotedPrintable(body: string): string {
  const bytes = body
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  return Buffer.from(bytes, "latin1").toString("utf8");
}

function decodeHeader(value: string): string {
  return value.replace(/=\?utf-8\?Q\?([^?]+)\?=/gi, (_, text: string) => decodeQuotedPrintable(text.replace(/_/g, " ")));
}
