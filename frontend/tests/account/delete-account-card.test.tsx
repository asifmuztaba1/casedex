import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteAccountCard from "@/features/account/delete-account-card";
import { hardNavigate } from "@/lib/hard-navigate";
import { createWrapper, mockApi } from "../utils";

vi.mock("@/lib/hard-navigate", () => ({ hardNavigate: vi.fn() }));

const preflight = (overrides: Record<string, unknown> = {}) => ({
  status: 200,
  body: { data: { can_delete: true, blocked_reason: null, workspace_will_be_deleted: false, grace_days: 30, ...overrides } },
});

function renderCard() {
  const { Wrapper } = createWrapper();
  return render(<DeleteAccountCard />, { wrapper: Wrapper });
}

describe("delete account card", () => {
  beforeEach(() => vi.mocked(hardNavigate).mockReset());

  it("sends the only admin to hand over first, without a delete form", async () => {
    mockApi({ "GET /api/v1/account/deletion": preflight({ can_delete: false, blocked_reason: "handover_required" }) });
    renderCard();

    expect(await screen.findByText(/only admin/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to team" })).toHaveAttribute("href", "/settings/team");
    expect(screen.queryByRole("button", { name: "Delete my account" })).not.toBeInTheDocument();
  });

  it("warns the last member that the workspace goes too", async () => {
    mockApi({ "GET /api/v1/account/deletion": preflight({ workspace_will_be_deleted: true }) });
    renderCard();

    expect(await screen.findByText(/last member of this workspace/)).toBeInTheDocument();
    expect(screen.getByText(/permanently deleted after 30 days/)).toBeInTheDocument();
  });

  it("needs the password and the confirmation before it can be submitted", async () => {
    mockApi({ "GET /api/v1/account/deletion": preflight() });
    renderCard();

    const submit = await screen.findByRole("button", { name: "Delete my account" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Your password"), { target: { value: "secret-pass" } });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I understand my account will be deleted"));
    expect(submit).toBeEnabled();
  });

  it("requests deletion and leaves for the login page", async () => {
    const { calls } = mockApi({
      "GET /api/v1/account/deletion": preflight(),
      "POST /api/v1/account/deletion": { status: 202, body: { data: { scheduled_for: "2026-11-02T00:00:00Z", workspace_will_be_deleted: false } } },
    });
    renderCard();

    fireEvent.change(await screen.findByLabelText("Your password"), { target: { value: "secret-pass" } });
    fireEvent.click(screen.getByLabelText("I understand my account will be deleted"));
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));

    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/login?account_deleted=1"));
    const post = calls.find((c) => c.method === "POST")!;
    expect(JSON.parse(post.init!.body as string)).toEqual({ password: "secret-pass" });
  });

  it("shows a wrong password and stays", async () => {
    mockApi({
      "GET /api/v1/account/deletion": preflight(),
      "POST /api/v1/account/deletion": { status: 422, body: { message: "That password is not correct.", errors: { password: ["That password is not correct."] } } },
    });
    renderCard();

    fireEvent.change(await screen.findByLabelText("Your password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByLabelText("I understand my account will be deleted"));
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That password is not correct.");
    expect(hardNavigate).not.toHaveBeenCalled();
  });
});
