#!/usr/bin/env node
/**
 * Generates natural audio for the page guide with ElevenLabs, once, so
 * Bangla users hear a real voice instead of the browser's (often missing)
 * Bangla voice. Only CaseDex's own help text is sent; no user data.
 *
 *   ELEVENLABS_API_KEY=… node scripts/generate-guide-audio.mjs
 *
 * Optional: ELEVENLABS_VOICE_BN / ELEVENLABS_VOICE_EN (voice ids from the
 * ElevenLabs Voice Library), --force to regenerate everything.
 *
 * Writes public/voice-guide/{bn,en}/*.mp3 and lib/voice-guide-manifest.json.
 * Unchanged scripts are skipped; commit the results.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scripts = JSON.parse(readFileSync(join(root, "lib/assistant-scripts.json"), "utf8"));
const manifestPath = join(root, "lib/voice-guide-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const force = process.argv.includes("--force");

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Set ELEVENLABS_API_KEY (the same key as Admin → Voice).");
  process.exit(1);
}

// Defaults are ElevenLabs library voices; pick native-sounding ones and override.
const voices = {
  bn: process.env.ELEVENLABS_VOICE_BN ?? "JBFqnCBsd6RMkjVDRZzb",
  en: process.env.ELEVENLABS_VOICE_EN ?? "21m00Tcm4TlvDq8ikWAM",
};

function slug(routeKey) {
  return routeKey.replace(/^\//, "").replace(/\//g, "-") || "home";
}

let generated = 0;
let skipped = 0;
for (const [routeKey, texts] of Object.entries(scripts)) {
  for (const locale of ["bn", "en"]) {
    const text = texts[locale];
    const file = `/voice-guide/${locale}/${slug(routeKey)}.mp3`;
    const diskPath = join(root, "public", file);
    const entryKey = `${locale}:${routeKey}`;

    if (!force && manifest[entryKey]?.text === text && existsSync(diskPath)) {
      skipped++;
      continue;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voices[locale]}?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: "eleven_v3", language_code: locale }),
      }
    );
    if (!response.ok) {
      const detail = (await response.text()).replaceAll(apiKey, "[key]").slice(0, 300);
      console.error(`✗ ${entryKey}: HTTP ${response.status} ${detail}`);
      process.exitCode = 1;
      continue;
    }

    mkdirSync(dirname(diskPath), { recursive: true });
    writeFileSync(diskPath, Buffer.from(await response.arrayBuffer()));
    manifest[entryKey] = { file, text };
    generated++;
    console.log(`✓ ${entryKey} → ${file}`);
  }
}

// Drop entries for scripts that no longer exist.
for (const key of Object.keys(manifest)) {
  const [locale, ...rest] = key.split(":");
  const routeKey = rest.join(":");
  if (!scripts[routeKey] || scripts[routeKey][locale] === undefined) delete manifest[key];
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Done: ${generated} generated, ${skipped} unchanged.`);
