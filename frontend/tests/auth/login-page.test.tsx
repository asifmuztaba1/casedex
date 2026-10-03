import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/(marketing)/login/page";
import { hardNavigate } from "@/lib/hard-navigate";
import { createWrapper, mockApi, tenantUser } from "../utils";

vi.mock("@/lib/hard-navigate", () => ({ hardNavigate: vi.fn() }));

function renderLogin() {
  const { Wrapper } = createWrapper();
  return render(<LoginPage />, { wrapper: Wrapper });
}

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("login page", () => {
  beforeEach(() => {
    vi.mocked(hardNavigate).mockReset();
  });

  it("asks for both fields before contacting the server", () => {
    const { calls } = mockApi({});
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getAllByText("This field is required.")).toHaveLength(2);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(calls).toEqual([]);
  });

  it("rejects a malformed email without contacting the server", () => {
    const { calls } = mockApi({});
    renderLogin();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret-pass" } });
    // Submit the form directly: the browser's own type="email" check would stop a click first.
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it("signs in and opens the workspace", async () => {
    mockApi({
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/login": { status: 200, body: { data: tenantUser } },
      "/api/v1/auth/me": { status: 200, body: { data: tenantUser } },
    });
    renderLogin();

    fillAndSubmit(tenantUser.email, "secret-pass");

    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/dashboard"));
    expect(screen.getByRole("button", { name: "Redirecting..." })).toBeDisabled();
  });

  it("shows an error and stays on the page when sign-in fails", async () => {
    mockApi({
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/login": { status: 422, body: { message: "These credentials do not match our records." } },
    });
    renderLogin();

    fillAndSubmit(tenantUser.email, "wrong");

    expect(await screen.findByText("Unable to sign in. Check your email and password.")).toBeInTheDocument();
    expect(hardNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("explains a pending account deletion when arriving from Settings", () => {
    mockApi({});
    window.history.pushState({}, "", "/login?account_deleted=1");
    renderLogin();

    expect(screen.getByRole("status")).toHaveTextContent("scheduled for deletion");
    window.history.pushState({}, "", "/login");
  });

  it("leaves a notice for the next page when sign-in cancelled a pending deletion", async () => {
    mockApi({
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/login": { status: 200, body: { data: tenantUser, meta: { account_deletion_cancelled: true } } },
      "/api/v1/auth/me": { status: 200, body: { data: tenantUser } },
    });
    renderLogin();

    fillAndSubmit(tenantUser.email, "secret-pass");

    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/dashboard"));
    expect(sessionStorage.getItem("casedex_flash_notice")).toBe("account_delete.cancelled_on_sign_in");
    sessionStorage.clear();
  });
});
