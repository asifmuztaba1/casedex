import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminInvitesPage from "@/app/(admin)/admin/invites/page";
import { createWrapper, mockApi } from "../utils";

const invite = {
  public_id: "01INV", code: "BETA2345", label: "Rahman & Associates", status: "active", max_uses: 3, uses_count: 1,
  expires_at: null, revoked_at: null, created_at: "2026-10-04T00:00:00Z", created_by: "QA Platform Admin",
  signup_url: "http://localhost:8080/register?invite=BETA2345",
  redeemed_by: [{ name: "Nusrat Jahan", email: "nusrat@example.test", workspace: "Jahan Chambers", signed_up_at: null }],
};
const listing = (canEdit: boolean) => ({ status: 200, body: { data: [invite], meta: { registration_mode: "invite", can_edit: canEdit } } });

function renderPage() {
  const { Wrapper } = createWrapper();
  return render(<AdminInvitesPage />, { wrapper: Wrapper });
}

describe("Admin → Invites", () => {
  it("lists codes with usage and who signed up", async () => {
    mockApi({ "GET /api/v1/admin/invite-codes": listing(true) });
    renderPage();

    expect(await screen.findByText("BETA2345")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("Nusrat Jahan · Jahan Chambers")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Invite only");
  });

  it("creates a code with the label, uses and expiry", async () => {
    const { calls } = mockApi({
      "GET /api/v1/admin/invite-codes": listing(true),
      "POST /api/v1/admin/invite-codes": { status: 201, body: { data: invite } },
    });
    renderPage();
    await screen.findByText("BETA2345");

    fireEvent.change(screen.getByLabelText("For"), { target: { value: "Karim Law" } });
    fireEvent.change(screen.getByLabelText("Uses"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Create code" }));

    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(JSON.parse(calls.find((c) => c.method === "POST")!.init!.body as string)).toEqual({ label: "Karim Law", max_uses: 5, expires_in_days: 30 });
  });

  it("is read-only for platform editors", async () => {
    mockApi({ "GET /api/v1/admin/invite-codes": listing(false) });
    renderPage();

    expect(await screen.findByText(/Only platform admins can create codes/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create code" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open registration to everyone" })).not.toBeInTheDocument();
  });
});
