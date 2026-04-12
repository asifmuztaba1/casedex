"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { data: user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tenant_id) {
      const hasWorkspaceAccess = user.tenant?.has_workspace_access ?? user.tenant?.has_active_subscription ?? false;
      router.replace(hasWorkspaceAccess ? "/dashboard" : "/settings/billing?onboarding=1");
      return;
    }

    if (!user.email_verified_at) {
      router.replace("/onboarding/account");
      return;
    }

    router.replace("/onboarding/workspace");
  }, [isLoading, router, user]);

  return null;
}
