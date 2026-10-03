import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n";

/**
 * Bangla users must not meet English: every key exists in both languages,
 * every t("key") in the code is defined, and component markup has no
 * hard-coded English sentences (they bypass the dictionary).
 */
const ROOT = join(__dirname, "..", "..");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "ui" ? [] : tsxFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = ["app", "components", "features"].flatMap((dir) => tsxFiles(join(ROOT, dir)));

/** Names that stay as they are in every language. */
const ALLOWED = new Set(["CaseDex", "Rocket", "bKash", "Nagad", "TXN..."]);

describe("translations", () => {
  it("has the same keys in English and Bangla", () => {
    const en = Object.keys(dictionaries.en);
    const bn = new Set(Object.keys(dictionaries.bn));
    expect(en.filter((key) => !bn.has(key))).toEqual([]);
    expect([...bn].filter((key) => !(key in dictionaries.en))).toEqual([]);
  });

  it("defines every key the code asks for", () => {
    const used = new Set<string>();
    for (const file of files) {
      for (const match of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([a-z0-9_.]+)"/g)) used.add(match[1]);
    }
    expect([...used].filter((key) => !(key in dictionaries.en))).toEqual([]);
  });

  it("has no hard-coded English sentences in component markup", () => {
    const found: string[] = [];
    for (const file of files.filter((f) => f.endsWith(".tsx"))) {
      readFileSync(file, "utf8").split("\n").forEach((line, index) => {
        const texts = [...line.matchAll(/>\s*([A-Z][A-Za-z,'’!?.\- ]{3,}[a-z.!?])\s*</g)].map((m) => m[1].trim());
        if (/^\s+[A-Z][a-z]+(?: [A-Za-z,'’.!?-]+){2,}\s*$/.test(line) && !/[=;{}()]/.test(line)) texts.push(line.trim());
        for (const m of line.matchAll(/\b(placeholder|aria-label|alt)="([A-Z][^"]{3,})"/g)) texts.push(m[2]);
        for (const text of texts) {
          if (!ALLOWED.has(text)) found.push(`${relative(ROOT, file)}:${index + 1}: ${text}`);
        }
      });
    }
    expect(found).toEqual([]);
  });
});
