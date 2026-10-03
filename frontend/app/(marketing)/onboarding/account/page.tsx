"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import OnboardingShell from "@/components/onboarding-shell";
import { useAuth, useResendVerificationEmail } from "@/features/auth/use-auth";
import { CheckCircle2, MailCheck } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function OnboardingAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useAuth();
  const resendVerification = useResendVerificationEmail();
  const { toast } = useToast();
  const { t } = useLocale();

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

    if (searchParams.get("verified") === "1") {
      toast({
        title: t("onboarding.email_verified"),
        description: t("onboarding.email_verified_desc"),
        variant: "success",
      });
    }

    if (user.email_verified_at) {
      router.replace("/onboarding/workspace");
    }
  }, [isLoading, router, searchParams, t, toast, user]);

  if (isLoading || !user) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">{t("common.loading")}</div>;
  }

  if (user.tenant_public_id) {
    return null;
  }

  return (
    <OnboardingShell
      step="account"
      title={t("onboarding.verify_title")}
      description={t("onboarding.verify_desc")}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><MailCheck className="h-5 w-5" />{t("onboarding.account_ready")}</CardTitle>
          <CardDescription>
            {t("onboarding.account_ready_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-soft)]">{t("onboarding.email_label")}</p>
            <p className="mt-1 text-base font-medium text-[var(--foreground)]">{user.email}</p>
          </div>

          {user.email_verified_at ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> {t("onboarding.verified")}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => resendVerification.mutate()} disabled={resendVerification.isPending}>
                {resendVerification.isPending ? t("onboarding.sending") : t("onboarding.resend")}
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
                }}
              >
                {t("onboarding.already_verified")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
