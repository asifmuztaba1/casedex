import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * app/not-found.tsx (a server component) translates with lib/i18n. With a
 * "use client" directive there, every unknown URL returned 500 instead of 404.
 */
describe("lib/i18n", () => {
  const source = readFileSync(join(__dirname, "..", "..", "lib", "i18n.ts"), "utf8");

  it("can be called from server components", () => {
    expect(source).not.toMatch(/^\s*["']use client["']/m);
  });

  it("does not touch browser-only APIs", () => {
    // Only code lines: dictionary entries are quoted text that may say "document." etc.
    const code = source
      .split("\n")
      .filter((line) => !/^\s*["'`]/.test(line))
      .join("\n");
    expect(code).not.toMatch(/\b(window|document|localStorage|sessionStorage)\./);
  });
});
