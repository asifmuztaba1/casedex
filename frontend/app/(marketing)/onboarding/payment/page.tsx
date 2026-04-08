"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import OnboardingShell from "@/components/onboarding-shell";
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft, type OnboardingPaymentSource } from "@/features/auth/onboarding-draft";
import { useAuth, useCreateTenant } from "@/features/auth/use-auth";
import { PLAN_CATALOG, type PlanId } from "@/features/billing/plan-catalog";
import type { BillingInterval } from "@/features/billing/types";
import { ArrowRight, BadgeCheck, CalendarClock, ShieldCheck } from "lucide-react";

function isValidPlan(value: string | null): value is PlanId {
  if (value === null) {
    return false;
  }

  return PLAN_CATALOG.some((item) => item.id === value);
}

export default function OnboardingPaymentPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useAuth();
  const createTenant = useCreateTenant();
  const { toast } = useToast();

  const draft = useMemo(() => (user ? loadOnboardingDraft(user.email) : null), [user]);
  const planFromQuery = searchParams.get("plan");
  const intervalFromQuery = searchParams.get("interval");
  const plan = isValidPlan(planFromQuery) ? planFromQuery : draft?.plan ?? null;
  const interval: BillingInterval = intervalFromQuery === "yearly" || draft?.interval === "yearly" ? "yearly" : "monthly";
  const paymentSource: OnboardingPaymentSource = draft?.payment_source ?? "manual_mfs";

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
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!plan) {
      router.replace("/onboarding/plan");
      return;
    }

    saveOnboardingDraft(user.email, {
      ...loadOnboardingDraft(user.email),
      plan,
      interval,
      payment_source: paymentSource ?? undefined,
    });
  }, [interval, paymentSource, plan, router, user]);

  const selectedPlan = useMemo(() => PLAN_CATALOG.find((item) => item.id === plan) ?? null, [plan]);

  if (isLoading || !user) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">Loading...</div>;
  }

  if (user.tenant_id) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">Redirecting...</div>;
  }

  if (!selectedPlan) {
    return (
      <OnboardingShell
        step="payment"
        title="Choose your package"
        description="Step 3 of 3. You need to select a package first."
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-[var(--muted)]">No package selected yet.</div>
            <Button className="mt-4" type="button" onClick={() => router.replace("/onboarding/plan")}>
              Go to package selection
            </Button>
          </CardContent>
        </Card>
      </OnboardingShell>
    );
  }

  const startBetaAccess = async () => {
    if (!user.country_id) {
      toast({
        title: "Country is required",
        description: "Please update your profile country and continue.",
        variant: "error",
      });
      return;
    }

    try {
      const firstPart = user.name.trim().split(/\s+/)[0] ?? "Workspace";
      const tenantName = `${firstPart} Workspace`;

      await createTenant.mutateAsync({
        tenant_name: tenantName,
        country_id: user.country_id,
        plan: selectedPlan.id,
        locale: user.locale ?? "en",
        skipToast: true,
      });

      clearOnboardingDraft(user.email);
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Trial started",
        description: `${selectedPlan.name} is now active for your 30-day trial.`,
        variant: "success",
      });
      router.push("/dashboard?trial=started");
    } catch (error) {
      toast({
        title: "Onboarding failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const price = interval === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;

  return (
    <OnboardingShell
      step="payment"
      title="Start your 30-day trial"
      description="Step 3 of 3. Review your selected package and start your workspace trial."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-[var(--muted)]" />Trial confirmation</CardTitle>
            <CardDescription>
              Your selected package will stay visible in Billing while the 30-day trial is active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
              <div className="text-sm font-semibold text-emerald-900">What happens next</div>
              <p className="mt-2 text-sm text-teal-900">
                Your workspace opens immediately on the {selectedPlan.name} package with full trial access. When the trial is nearing the end, the Billing page will guide you through the next step.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-4 text-sm text-[var(--muted)]">
              No payment procedure is needed during onboarding. This step only confirms the package and starts the trial.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/onboarding/plan")}>Back to package</Button>
              <Button type="button" onClick={startBetaAccess} disabled={createTenant.isPending || !paymentSource}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {createTenant.isPending ? "Please wait..." : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><BadgeCheck className="h-4 w-4 text-[var(--muted)]" />Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Package</div>
              <div className="mt-1 text-base font-semibold text-[var(--foreground)]">{selectedPlan.name}</div>
              <div className="text-[var(--muted)]">{selectedPlan.storage}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Cycle</div>
              <div className="mt-1 text-base font-semibold text-[var(--foreground)]">{interval === "monthly" ? "Monthly" : "Yearly"}</div>
              <div className="text-[var(--muted)]">{price}</div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <div className="mb-1 inline-flex items-center gap-1 font-semibold"><CalendarClock className="h-3.5 w-3.5" />30-day trial</div>
              No charge today. Near the end of the trial, Billing will guide the team through the next billing step.
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingShell>
  );
}
