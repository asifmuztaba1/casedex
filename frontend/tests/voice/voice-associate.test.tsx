import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VoiceAssociate from "@/components/voice-associate";
import { Toaster } from "@/components/ui/toaster";
import type { AssociateTools } from "@/features/voice/associate-tools";
import { createWrapper, mockApi } from "../utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

/** The ElevenLabs SDK needs a microphone and WebRTC; the test drives its callbacks directly. */
const call = vi.hoisted(() => ({
  status: "disconnected" as string,
  startSession: vi.fn(),
  endSession: vi.fn(),
  sendContextualUpdate: vi.fn(),
  options: null as null | { clientTools: AssociateTools; onMessage: (m: { message: string; source: string }) => void },
}));
vi.mock("@elevenlabs/react", () => ({
  ConversationProvider: ({ children }: { children: React.ReactNode }) => children,
  useConversation: (options: typeof call.options) => {
    call.options = options;
    return { ...call, isSpeaking: false };
  },
}));

const CASE_ID = "01JABCDEFGHJKMNPQRSTVWXYZ0";

const status = (overrides: Record<string, unknown> = {}) => ({
  status: 200,
  body: {
    data: {
      dictation_available: true,
      associate_available: true,
      associate_credits_per_minute: 2,
      consent_given: true,
      max_seconds: 180,
      seconds_per_credit: 120,
      zero_retention: false,
      ...overrides,
    },
  },
});

const routes = (overrides: Record<string, unknown> = {}) => ({
  "GET /api/v1/voice/status": status(overrides),
  "POST /api/v1/voice/associate/sessions": {
    status: 201,
    body: { data: { session_public_id: "01JSESSION", conversation_token: "tok_123", max_seconds: 600, dynamic_variables: { user_name: "Rahim", greeting: "Hello" } } },
  },
  "POST /api/v1/voice/associate/sessions/01JSESSION/end": { status: 200, body: { data: {} } },
  "POST /api/v1/voice/consent": { status: 200, body: { data: { consent_given: true } } },
  [`GET /api/v1/cases/${CASE_ID}`]: { status: 200, body: { data: { public_id: CASE_ID, title: "Rahim v. Karim" } } },
  [`POST /api/v1/cases/${CASE_ID}/diary`]: { status: 201, body: { data: {} } },
});

function renderAssociate() {
  const { Wrapper } = createWrapper();
  render(
    <>
      <VoiceAssociate />
      <Toaster />
    </>,
    { wrapper: Wrapper }
  );
}

async function openPanel() {
  fireEvent.click(await screen.findByRole("button", { name: /^Associate/ }));
}

beforeEach(() => {
  call.status = "disconnected";
  call.options = null;
  vi.clearAllMocks();
});

describe("VoiceAssociate", () => {
  it("is only shown to firms in the beta", async () => {
    const { calls } = mockApi(routes({ associate_available: false }));
    renderAssociate();

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(screen.queryByRole("button", { name: /Associate/ })).not.toBeInTheDocument();
  });

  it("starts the call with the one-time token from CaseDex", async () => {
    const { calls } = mockApi(routes());
    renderAssociate();
    await openPanel();

    expect(screen.getByText(/Each started minute uses 2 AI credits/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start talking" }));

    await waitFor(() =>
      expect(call.startSession).toHaveBeenCalledWith({
        conversationToken: "tok_123",
        connectionType: "webrtc",
        dynamicVariables: { user_name: "Rahim", greeting: "Hello" },
      })
    );
    expect(calls.some((c) => c.method === "POST" && c.path === "/api/v1/voice/associate/sessions")).toBe(true);
  });

  it("asks for consent before the first call", async () => {
    const { calls } = mockApi(routes({ consent_given: false }));
    renderAssociate();
    await openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Start talking" }));
    expect(await screen.findByText(/case details the associate looks up are sent to its language model/)).toBeInTheDocument();
    expect(call.startSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "I agree, start the call" }));
    await waitFor(() => expect(call.startSession).toHaveBeenCalled());
    expect(calls.some((c) => c.path === "/api/v1/voice/consent")).toBe(true);
  });

  it("saves a draft only after the lawyer edits and confirms it", async () => {
    const { calls } = mockApi(routes());
    renderAssociate();
    await openPanel();
    call.status = "connected";

    await act(async () => {
      await call.options!.clientTools.draft_diary_entry({ case_public_id: CASE_ID, title: "Deed", body: "Client brings the deed." });
    });

    expect(screen.getByText(/AI draft, not legal advice/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === "POST" && c.path.endsWith("/diary"))).toBe(false);

    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Client brings the deed on Monday." } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm and save" }));

    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.path === `/api/v1/cases/${CASE_ID}/diary`)).toBe(true));
    const saved = calls.find((c) => c.path === `/api/v1/cases/${CASE_ID}/diary`)!;
    expect(JSON.parse(String(saved.init?.body))).toMatchObject({ title: "Deed", body: "Client brings the deed on Monday." });
    await waitFor(() => expect(call.sendContextualUpdate).toHaveBeenCalledWith(expect.stringContaining("reviewed and saved")));
    expect(screen.queryByRole("button", { name: "Confirm and save" })).not.toBeInTheDocument();
  });

  it("discards a draft without saving anything", async () => {
    const { calls } = mockApi(routes());
    renderAssociate();
    await openPanel();
    call.status = "connected";

    await act(async () => {
      await call.options!.clientTools.draft_diary_entry({ case_public_id: CASE_ID, title: "Deed", body: "Note" });
    });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(call.sendContextualUpdate).toHaveBeenCalledWith(expect.stringContaining("Nothing was saved"));
    expect(calls.some((c) => c.method === "POST" && c.path.endsWith("/diary"))).toBe(false);
  });

  it("speaks with the transcript shown on screen", async () => {
    mockApi(routes());
    renderAssociate();
    await openPanel();

    act(() => call.options!.onMessage({ message: "আজ কয়টা শুনানি?", source: "user" }));
    act(() => call.options!.onMessage({ message: "আজ দুটি শুনানি আছে।", source: "ai" }));

    expect(screen.getByText("আজ কয়টা শুনানি?")).toBeInTheDocument();
    expect(screen.getByText("আজ দুটি শুনানি আছে।")).toBeInTheDocument();
  });
});
