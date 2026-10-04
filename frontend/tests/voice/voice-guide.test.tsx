import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import scripts from "@/lib/assistant-scripts.json";
import { createWrapper } from "../utils";

const dashboardText = (scripts as Record<string, { en: string; bn: string }>)["/dashboard"].en;
const manifest: Record<string, { file: string; text: string }> = {};

vi.mock("@/lib/voice-guide-manifest.json", () => ({ default: manifest }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

const played: string[] = [];
class FakeAudio {
  src: string;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
  }
  play() {
    played.push(this.src);
    this.onplay?.();
    return Promise.resolve();
  }
  pause() {}
}

const speak = vi.fn();

beforeEach(() => {
  played.length = 0;
  speak.mockReset();
  for (const key of Object.keys(manifest)) delete manifest[key];
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("SpeechSynthesisUtterance", class { lang = ""; rate = 1; pitch = 1; volume = 1; voice = null; constructor(public text: string) {} });
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { speak, cancel: vi.fn(), getVoices: () => [], addEventListener: vi.fn(), removeEventListener: vi.fn() },
  });
  // Not a first visit, so nothing plays until the user asks.
  window.localStorage.setItem("casedex_assistant_visited__dashboard", "true");
});

async function listen() {
  const { default: VoiceAssistant } = await import("@/components/voice-assistant");
  const { Wrapper } = createWrapper();
  render(<VoiceAssistant />, { wrapper: Wrapper });
  fireEvent.click(screen.getByTitle("Listen to assistant"));
}

describe("page guide voice", () => {
  it("plays the recorded ElevenLabs audio when it matches the script", async () => {
    manifest["en:/dashboard"] = { file: "/voice-guide/en/dashboard.mp3", text: dashboardText };

    await listen();

    expect(played).toEqual(["/voice-guide/en/dashboard.mp3"]);
    expect(speak).not.toHaveBeenCalled();
  });

  it("falls back to the browser voice when the script changed since the audio was made", async () => {
    manifest["en:/dashboard"] = { file: "/voice-guide/en/dashboard.mp3", text: "An older version of the script." };

    await listen();

    expect(played).toEqual([]);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("uses the browser voice when no audio has been generated", async () => {
    await listen();

    expect(played).toEqual([]);
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
