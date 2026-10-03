import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "@/app/(marketing)/register/page";
import { createWrapper, mockApi } from "../utils";

let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => search,
}));

const countries = { status: 200, body: { data: [{ id: 1, name: "Bangladesh", code: "BD", active: true }] } };

function renderRegister(query = "") {
  search = new URLSearchParams(query);
  const { Wrapper } = createWrapper();
  return render(<RegisterPage />, { wrapper: Wrapper });
}

function fillIn() {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Nusrat Jahan" } });
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "nusrat@example.test" } });
  fireEvent.change(screen.getByLabelText("Country"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Invite#2026pass" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "Invite#2026pass" } });
}

describe("sign-up during the private beta", () => {
  it("asks for an invite code, prefilled from the sign-up link", async () => {
    mockApi({ "/api/v1/countries": countries, "/api/v1/auth/registration": { status: 200, body: { data: { mode: "invite" } } } });
    renderRegister("invite=BETA2345");

    expect(await screen.findByLabelText("Invite code")).toHaveValue("BETA2345");
    expect(screen.getByRole("link", { name: "Ask for an invite" })).toHaveAttribute("href", "/contact");
  });

  it("sends the invite code with the sign-up", async () => {
    const { calls } = mockApi({
      "/api/v1/countries": countries,
      "/api/v1/auth/registration": { status: 200, body: { data: { mode: "invite" } } },
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/register": { status: 201, body: { data: { public_id: "01U", tenant_public_id: null } } },
    });
    renderRegister("invite=BETA2345");
    await screen.findByLabelText("Invite code");
    await screen.findByRole("option", { name: /Bangladesh/ });
    fillIn();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(calls.some((c) => c.path === "/api/v1/auth/register")).toBe(true));
    const body = JSON.parse(calls.find((c) => c.path === "/api/v1/auth/register")!.init!.body as string);
    expect(body.invite_code).toBe("BETA2345");
  });

  it("hides the field when registration is open", async () => {
    mockApi({ "/api/v1/countries": countries, "/api/v1/auth/registration": { status: 200, body: { data: { mode: "open" } } } });
    renderRegister();

    await screen.findByLabelText("Full name");
    await waitFor(() => expect(screen.queryByLabelText("Invite code")).not.toBeInTheDocument());
  });
});
