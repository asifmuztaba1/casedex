import { describe, expect, it } from "vitest";
import { loginDestination } from "@/features/auth/login-destination";

describe("loginDestination", () => {
  it("sends platform staff to the admin console", () => {
    expect(loginDestination({ role: "platform_admin", tenant_public_id: null })).toBe("/admin");
    expect(loginDestination({ role: "platform_editor", tenant_public_id: null })).toBe("/admin");
  });

  it("sends users without a workspace to onboarding", () => {
    expect(loginDestination({ role: "admin", tenant_public_id: null })).toBe("/onboarding");
  });

  it("sends workspaces without access to billing", () => {
    expect(
      loginDestination({ role: "admin", tenant_public_id: "01TENANT", tenant: { has_workspace_access: false } })
    ).toBe("/settings/billing?onboarding=1");
    expect(loginDestination({ role: "lawyer", tenant_public_id: "01TENANT", tenant: null })).toBe(
      "/settings/billing?onboarding=1"
    );
  });

  it("sends everyone else to the dashboard", () => {
    expect(
      loginDestination({ role: "lawyer", tenant_public_id: "01TENANT", tenant: { has_workspace_access: true } })
    ).toBe("/dashboard");
    expect(
      loginDestination({ role: "viewer", tenant_public_id: "01TENANT", tenant: { has_active_subscription: true } })
    ).toBe("/dashboard");
  });
});
