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

export default function OnboardingAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useAuth();
  const resendVerification = useResendVerificationEmail();
  const { toast } = useToast();

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

    if (searchParams.get("verified") === "1") {
      toast({
        title: "Email verified",
        description: "You can continue to package selection.",
        variant: "success",
      });
    }

    if (user.email_verified_at) {
      router.replace("/onboarding/plan");
    }
  }, [isLoading, router, searchParams, toast, user]);

  if (isLoading || !user) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">Loading...</div>;
  }

  if (user.tenant_id) {
    return null;
  }

  return (
    <OnboardingShell
      step="account"
      title="Verify your email"
      description="Step 1 of 3. Confirm your email address to unlock package and payment setup."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><MailCheck className="h-5 w-5" />Account ready</CardTitle>
          <CardDescription>
            We created your account. Please verify this email before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-soft)]">Email</p>
            <p className="mt-1 text-base font-medium text-[var(--foreground)]">{user.email}</p>
          </div>

          {user.email_verified_at ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => resendVerification.mutate()} disabled={resendVerification.isPending}>
                {resendVerification.isPending ? "Sending..." : "Resend verification email"}
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
                }}
              >
                I already verified
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
