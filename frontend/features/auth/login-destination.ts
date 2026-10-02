import type { AuthUser } from "@/features/auth/use-auth";

type LoginUser = Pick<AuthUser, "tenant_public_id" | "role"> & {
  tenant?: Pick<NonNullable<AuthUser["tenant"]>, "has_workspace_access" | "has_active_subscription"> | null;
};

/** Where a user lands right after signing in. */
export function loginDestination(user: LoginUser): string {
  if (user.role === "platform_admin" || user.role === "platform_editor") {
    return "/admin";
  }
  if (!user.tenant_public_id) {
    return "/onboarding";
  }

  const hasWorkspaceAccess =
    user.tenant?.has_workspace_access ?? user.tenant?.has_active_subscription ?? false;

  return hasWorkspaceAccess ? "/dashboard" : "/settings/billing?onboarding=1";
}
