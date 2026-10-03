import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminAiPage from "@/app/(admin)/admin/ai/page";
import { createWrapper, mockApi } from "../utils";

const provider = (overrides: Record<string, unknown>) => ({
  provider: "groq",
  label: "Groq",
  model: "llama-3.3-70b-versatile",
  base_url: "https://api.groq.com/openai/v1",
  has_api_key: false,
  api_key_last4: null,
  is_active: false,
  last_tested_at: null,
  last_test_ok: null,
  updated_by: null,
  updated_at: null,
  default_model: "llama-3.3-70b-versatile",
  suggested_models: ["llama-3.3-70b-versatile"],
  key_url: "https://console.groq.com/keys",
  ...overrides,
});

const listing = (canEdit: boolean, groq: Record<string, unknown> = {}) => ({
  status: 200,
  body: {
    data: [
      provider({ provider: "gemini", label: "Google Gemini", model: "gemini-flash-latest", key_url: "https://aistudio.google.com/apikey" }),
      provider(groq),
    ],
    meta: { in_use: { source: "env", model: "env-model", configured: false }, can_edit: canEdit },
  },
});

function renderPage() {
  const { Wrapper } = createWrapper();
  return render(<AdminAiPage />, { wrapper: Wrapper });
}

function groqCard() {
  return screen.getByRole("region", { name: "Groq" });
}

describe("Admin → AI provider page", () => {
  it("says when no provider is configured", async () => {
    mockApi({ "GET /api/v1/admin/ai-providers": listing(true) });
    renderPage();

    expect(await screen.findByText(/No AI provider is configured/)).toBeInTheDocument();
  });

  it("is read-only for platform editors", async () => {
    mockApi({ "GET /api/v1/admin/ai-providers": listing(false) });
    renderPage();

    expect(await screen.findByText("Only platform admins can change these settings.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    for (const input of screen.getAllByLabelText("Model")) expect(input).toBeDisabled();
  });

  it("sends the key only when one is typed", async () => {
    const { calls } = mockApi({
      "GET /api/v1/admin/ai-providers": listing(true, { has_api_key: true, api_key_last4: "1234" }),
      "PUT /api/v1/admin/ai-providers/groq": { status: 200, body: { data: provider({ has_api_key: true }) } },
    });
    renderPage();
    await screen.findByText("Groq");
    const card = groqCard();

    expect(within(card).getByLabelText("API key")).toHaveAttribute("placeholder", "Saved key ending 1234. Leave blank to keep it.");
    fireEvent.change(within(card).getByLabelText("Model"), { target: { value: "llama-3.1-8b-instant" } });
    fireEvent.click(within(card).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    const body = JSON.parse(calls.find((c) => c.method === "PUT")!.init!.body as string);
    expect(body).toEqual({ model: "llama-3.1-8b-instant" });
  });

  it("shows the connection test result", async () => {
    mockApi({
      "GET /api/v1/admin/ai-providers": listing(true, { has_api_key: true, api_key_last4: "1234" }),
      "POST /api/v1/admin/ai-providers/groq/test": { status: 200, body: { data: { ok: false, latency_ms: 120, reply: null, error: "HTTP 401 from the provider: Invalid API Key" } } },
    });
    renderPage();
    await screen.findByText("Groq");

    fireEvent.click(within(groqCard()).getByRole("button", { name: "Test connection" }));

    expect(await screen.findByText(/Connection failed\. HTTP 401 from the provider: Invalid API Key/)).toBeInTheDocument();
  });
});
