import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DictationButton from "@/components/dictation-button";
import { Toaster } from "@/components/ui/toaster";
import { appendDictation } from "@/features/voice/use-voice";
import { createWrapper, mockApi } from "../utils";

/** jsdom has no microphone: a recorder that hands back one chunk of "audio". */
class FakeMediaRecorder {
  static isTypeSupported = (type: string) => type.startsWith("audio/webm");
  mimeType: string;
  stream: MediaStream;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(stream: MediaStream, options: { mimeType: string }) {
    this.stream = stream;
    this.mimeType = options.mimeType;
  }
  start() {}
  stop() {
    this.ondataavailable?.({ data: new Blob(["audio"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const status = (overrides: Record<string, unknown> = {}) => ({
  status: 200,
  body: { data: { dictation_available: true, consent_given: true, max_seconds: 180, seconds_per_credit: 120, zero_retention: false, ...overrides } },
});

function renderButton(onText = vi.fn()) {
  const { Wrapper } = createWrapper();
  render(
    <>
      <DictationButton onText={onText} />
      <Toaster />
    </>,
    { wrapper: Wrapper }
  );
  return onText;
}

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DictationButton", () => {
  it("stays hidden until voice is switched on", async () => {
    const { calls } = mockApi({ "GET /api/v1/voice/status": status({ dictation_available: false }) });
    renderButton();

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(screen.queryByRole("button", { name: "Dictate" })).not.toBeInTheDocument();
  });

  it("asks for consent once, then records and adds the text for review", async () => {
    const { calls } = mockApi({
      "GET /api/v1/voice/status": status({ consent_given: false }),
      "POST /api/v1/voice/consent": { status: 200, body: { data: { consent_given: true } } },
      "POST /api/v1/voice/transcriptions": {
        status: 200,
        body: { data: { text: "শুনানি মুলতবি।", language_code: "ben", duration_seconds: 12, credits_charged: 1 } },
      },
    });
    const onText = renderButton();

    fireEvent.click(await screen.findByRole("button", { name: "Dictate" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/sent to ElevenLabs/)).toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "I agree, start recording" }));
    const stop = await screen.findByRole("button", { name: /Stop recording/ });
    expect(calls.some((c) => c.method === "POST" && c.path === "/api/v1/voice/consent")).toBe(true);

    await act(async () => {
      fireEvent.click(stop);
    });

    await waitFor(() => expect(onText).toHaveBeenCalledWith("শুনানি মুলতবি।"));
    const upload = calls.find((c) => c.path === "/api/v1/voice/transcriptions")!;
    const form = upload.init!.body as FormData;
    expect(form.get("audio")).toBeInstanceOf(Blob);
    expect(Number(form.get("duration_seconds"))).toBeGreaterThanOrEqual(1);
  });

  it("explains a blocked microphone", async () => {
    mockApi({ "GET /api/v1/voice/status": status() });
    navigator.mediaDevices.getUserMedia = vi.fn(async () => {
      throw new Error("NotAllowedError");
    });
    const onText = renderButton();

    fireEvent.click(await screen.findByRole("button", { name: "Dictate" }));

    expect(await screen.findByText("Microphone not allowed")).toBeInTheDocument();
    expect(onText).not.toHaveBeenCalled();
  });
});

describe("appendDictation", () => {
  it("adds dictated text on a new line after what is already there", () => {
    expect(appendDictation("", " New note ")).toBe("New note");
    expect(appendDictation("Existing minutes. ", "More.")).toBe("Existing minutes.\nMore.");
    expect(appendDictation("Keep me", "   ")).toBe("Keep me");
  });
});
