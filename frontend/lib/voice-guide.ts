/**
 * Natural recorded audio for the page guide (ElevenLabs), generated once by
 * scripts/generate-guide-audio.mjs into public/voice-guide/. The manifest
 * keeps the exact text each file was made from, so audio is only played
 * while it still matches the script; otherwise the browser voice is used.
 */
import manifestData from "@/lib/voice-guide-manifest.json";

type ManifestEntry = { file: string; text: string };

const manifest: Record<string, ManifestEntry> = manifestData;

export function guideAudioUrl(routeKey: string, locale: "en" | "bn", text: string): string | null {
  const entry = manifest[`${locale}:${routeKey}`];
  return entry && entry.text === text ? entry.file : null;
}
