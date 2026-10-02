import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SignedInDevicesCard from "@/features/devices/signed-in-devices-card";
import { createWrapper, mockApi } from "../utils";

const devices = [
  {
    public_id: "01PIXEL",
    name: "Rahim's Pixel 8",
    platform: "android",
    push_enabled: true,
    is_current: false,
    last_used_at: "2026-10-02T09:00:00.000Z",
    expires_at: "2026-12-01T09:00:00.000Z",
    created_at: "2026-10-01T09:00:00.000Z",
  },
  {
    public_id: "01IPAD",
    name: "Office iPad",
    platform: "ios",
    push_enabled: false,
    is_current: false,
    last_used_at: null,
    expires_at: "2026-12-01T09:00:00.000Z",
    created_at: "2026-10-01T09:00:00.000Z",
  },
];

function renderCard() {
  const { Wrapper } = createWrapper();
  return render(<SignedInDevicesCard />, { wrapper: Wrapper });
}

describe("signed-in phones card", () => {
  it("lists the phones signed in to the account", async () => {
    mockApi({ "GET /api/v1/devices": { status: 200, body: { data: devices } } });
    renderCard();

    expect(await screen.findByText("Rahim's Pixel 8")).toBeInTheDocument();
    expect(screen.getByText(/Android · Last used .* · Notifications on/)).toBeInTheDocument();
    expect(screen.getByText("iPhone / iPad · Not used yet")).toBeInTheDocument();
  });

  it("says so when no phone is signed in, without a sign-out-all button", async () => {
    mockApi({ "GET /api/v1/devices": { status: 200, body: { data: [] } } });
    renderCard();

    expect(await screen.findByText("No phones are signed in to your account.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out all phones" })).not.toBeInTheDocument();
  });

  it("signs out one phone after confirming", async () => {
    const { calls } = mockApi({
      "GET /api/v1/devices": { status: 200, body: { data: devices } },
      "DELETE /api/v1/devices/01PIXEL": { status: 204 },
    });
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: "Sign out: Rahim's Pixel 8" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Rahim's Pixel 8 will be signed out/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);

    fireEvent.click(within(dialog).getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(calls).toContainEqual(expect.objectContaining({ method: "DELETE", path: "/api/v1/devices/01PIXEL" }))
    );
  });

  it("signs out every phone after confirming", async () => {
    const { calls } = mockApi({
      "GET /api/v1/devices": { status: 200, body: { data: devices } },
      "DELETE /api/v1/devices": { status: 200, body: { data: { revoked: 2 } } },
    });
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: "Sign out all phones" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Sign out all phones" }));

    await waitFor(() =>
      expect(calls).toContainEqual(expect.objectContaining({ method: "DELETE", path: "/api/v1/devices" }))
    );
  });
});
