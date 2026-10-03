"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import OnboardingShell from "@/components/onboarding-shell";
import { useAuth, useCreateTenant } from "@/features/auth/use-auth";
import { clearOnboardingDraft } from "@/features/auth/onboarding-draft";
import { ArrowRight, CalendarClock, Rocket } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function OnboardingWorkspacePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user, isLoading } = useAuth();
  const createTenant = useCreateTenant();
  const { toast } = useToast();
  const { t } = useLocale();
  // null until the user types, so the suggested default can be derived from the user.
  const [workspaceNameInput, setWorkspaceName] = useState<string | null>(null);
  const workspaceName =
    workspaceNameInput ??
    (user
      ? t("onboarding.default_workspace_name").replace("{name}", user.name.trim().split(/\s+/)[0] || t("onboarding.default_workspace_owner"))
      : "");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tenant_public_id) {
      const hasWorkspaceAccess = user.tenant?.has_workspace_access ?? user.tenant?.has_active_subscription ?? false;
      router.replace(hasWorkspaceAccess ? "/dashboard" : "/settings/billing?onboarding=1");
      return;
    }

    if (!user.email_verified_at) {
      router.replace("/onboarding/account");
      return;
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.tenant_public_id) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">{t("common.loading")}</div>;
  }

  const startTrial = async () => {
    const name = workspaceName.trim();
    if (!name) {
      toast({
        title: t("onboarding.name_required"),
        description: t("onboarding.name_required_desc"),
        variant: "error",
      });
      return;
    }

    if (!user.country_id) {
      toast({
        title: t("onboarding.country_required"),
        description: t("onboarding.country_required_desc"),
        variant: "error",
      });
      return;
    }

    try {
      await createTenant.mutateAsync({
        tenant_name: name,
        country_id: user.country_id,
        plan: "starter",
        locale: user.locale ?? "en",
        skipToast: true,
      });

      clearOnboardingDraft(user.email);
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: t("onboarding.welcome"),
        description: t("onboarding.trial_started"),
        variant: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: t("onboarding.error"),
        description: error instanceof Error ? error.message : t("onboarding.try_again"),
        variant: "error",
      });
    }
  };

  return (
    <OnboardingShell
      step="workspace"
      title={t("onboarding.workspace_title")}
      description={t("onboarding.workspace_desc")}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-5 w-5 text-[var(--muted)]" />
            {t("onboarding.almost_there")}
          </CardTitle>
          <CardDescription>
            {t("onboarding.workspace_explainer")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              {t("onboarding.workspace_name")}
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder={t("onboarding.workspace_placeholder")}
            />
            <p className="text-xs text-[var(--muted-soft)]">
              {t("onboarding.change_later")}
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex items-center gap-2 font-semibold">
              <CalendarClock className="h-4 w-4" />
              {t("onboarding.trial_title")}
            </div>
            <p className="mt-1">
              {t("onboarding.trial_desc")}
            </p>
          </div>

          <Button
            type="button"
            onClick={startTrial}
            disabled={createTenant.isPending}
            className="w-full sm:w-auto"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            {createTenant.isPending ? t("onboarding.creating") : t("onboarding.start_trial")}
          </Button>
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
