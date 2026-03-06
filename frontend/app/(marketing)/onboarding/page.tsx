"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";
import { loadOnboardingDraft } from "@/features/auth/onboarding-draft";

export default function OnboardingIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

    const draft = loadOnboardingDraft(user.email);
    const planFromQuery = searchParams.get("plan");
    const intervalFromQuery = searchParams.get("interval");

    if (draft.plan || planFromQuery) {
      const query = new URLSearchParams();
      if (planFromQuery) {
        query.set("plan", planFromQuery);
      }
      if (intervalFromQuery === "yearly") {
        query.set("interval", "yearly");
      }

      const suffix = query.toString();
      router.replace(suffix ? `/onboarding/payment?${suffix}` : "/onboarding/payment");
      return;
    }

    router.replace("/onboarding/plan");
  }, [isLoading, router, searchParams, user]);

  return null;
}
