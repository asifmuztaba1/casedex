/**
 * Per-page voice assistant scripts in English and Bengali.
 * Each key matches a pathname prefix. The assistant reads the
 * matching script when the user lands on that page.
 *
 * The text lives in assistant-scripts.json so the audio generator
 * (scripts/generate-guide-audio.mjs) reads the same source.
 */
import scriptData from "@/lib/assistant-scripts.json";

export type Script = { en: string; bn: string };

const scripts: Record<string, Script> = scriptData;

/** The best matching script and its route key: exact match first, else the longest prefix. */
export function getAssistantScriptEntry(pathname: string): { key: string; script: Script } | null {
  if (scripts[pathname]) return { key: pathname, script: scripts[pathname] };

  let bestKey: string | null = null;
  for (const key of Object.keys(scripts)) {
    if (pathname.startsWith(key) && key.length > (bestKey?.length ?? 0)) {
      bestKey = key;
    }
  }
  return bestKey ? { key: bestKey, script: scripts[bestKey] } : null;
}

/** Returns the best matching script for the given pathname. */
export function getAssistantScript(pathname: string): Script | null {
  return getAssistantScriptEntry(pathname)?.script ?? null;
}

export function allAssistantScripts(): Record<string, Script> {
  return scripts;
}
