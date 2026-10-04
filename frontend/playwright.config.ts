import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against a running stack (nginx → Next.js + Laravel), as in
 * production. CI starts the stack (.github/workflows/ci.yml, job "e2e");
 * locally, point E2E_BASE_URL at the docker compose stack.
 */
export default defineConfig({
  testDir: "./e2e",
  // The specs share one database; run them in order.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-US",
    timezoneId: "Asia/Dhaka",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
