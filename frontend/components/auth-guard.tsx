"use client"

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useAuth();
  const hasWorkspaceAccess =
    user?.tenant?.has_workspace_access ?? user?.tenant?.has_active_subscription ?? false;
  const isBillingSuccessReturn =
    pathname === "/dashboard" && searchParams.get("billing") === "success";

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user && !user.tenant_id) {
      router.replace("/subscribe");
      return;
    }

    if (
      !isLoading &&
      user?.tenant_id &&
      hasWorkspaceAccess === false &&
      pathname !== "/settings/billing" &&
      !isBillingSuccessReturn
    ) {
      router.replace("/settings/billing?onboarding=1");
    }
  }, [hasWorkspaceAccess, isBillingSuccessReturn, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">
        Loading workspace...
      </div>
    );
  }

  if (!user || !user.tenant_id) {
    return null;
  }

  if (
    user?.tenant_id &&
    hasWorkspaceAccess === false &&
    pathname !== "/settings/billing" &&
    !isBillingSuccessReturn
  ) {
    return null;
  }

  return <>{children}</>;
}
