import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * If a form is submitted before its JavaScript has loaded, the browser does
 * a native submit. With the default GET that puts the password in the URL
 * (history, server and proxy logs). Every form in a component with a
 * password field must declare method="post".
 */
const ROOT = join(__dirname, "..", "..");
const SOURCE_DIRS = ["app", "features", "components"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

describe("forms with password fields", () => {
  const files = SOURCE_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir))).filter((file) =>
    readFileSync(file, "utf8").includes('type="password"')
  );

  it("finds the password forms", () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  it.each(files.map((file) => [relative(ROOT, file), file]))("%s posts instead of getting", (_name, file) => {
    const source = readFileSync(file, "utf8");
    const openingTags = source.match(/<form\b[^>]*>/g) ?? [];
    for (const tag of openingTags) {
      expect(tag).toMatch(/method="post"/);
    }
  });
});
