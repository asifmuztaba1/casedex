"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OnboardingShell from "@/components/onboarding-shell";
import { type AuthUser, useAuth } from "@/features/auth/use-auth";
import { loadOnboardingDraft, saveOnboardingDraft } from "@/features/auth/onboarding-draft";
import { PLAN_CATALOG, type PlanId } from "@/features/billing/plan-catalog";
import type { BillingInterval } from "@/features/billing/types";
import { cn } from "@/lib/utils";
import { ArrowRight, BriefcaseBusiness, CalendarClock, Gem, Scale, ShieldCheck } from "lucide-react";

function isValidPlan(value: string | null): value is PlanId {
  if (value === null) {
    return false;
  }

  return PLAN_CATALOG.some((item) => item.id === value);
}

export default function OnboardingPlanPage() {
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
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading...</div>;
  }

  if (user.tenant_id) {
    return null;
  }

  return <OnboardingPlanContent key={`${user.email}:${searchParams.toString()}`} user={user} queryString={searchParams.toString()} />;
}

function OnboardingPlanContent({ user, queryString }: { user: AuthUser; queryString: string }) {
  const router = useRouter();
  const search = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const draft = useMemo(() => loadOnboardingDraft(user.email), [user.email]);
  const [plan, setPlan] = useState<PlanId | null>(() => {
    const planFromQuery = search.get("plan");
    return isValidPlan(planFromQuery) ? planFromQuery : draft.plan ?? null;
  });
  const [interval, setInterval] = useState<BillingInterval>(() => (
    search.get("interval") === "yearly" || draft.interval === "yearly" ? "yearly" : "monthly"
  ));

  useEffect(() => {
    saveOnboardingDraft(user.email, {
      ...loadOnboardingDraft(user.email),
      plan: plan ?? undefined,
      interval,
    });
  }, [interval, plan, user.email]);

  const selectedPlan = useMemo(() => PLAN_CATALOG.find((item) => item.id === plan) ?? null, [plan]);

  return (
    <OnboardingShell
      step="plan"
      title="Choose your package"
      description="Step 2 of 3. Select the package and billing cycle for your workspace."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><BriefcaseBusiness className="h-5 w-5 text-slate-700" />Plans built for legal teams</CardTitle>
          <CardDescription>
            Every package includes unlimited cases and team members. Differences are storage and service level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <Button type="button" size="sm" variant={interval === "monthly" ? "default" : "ghost"} onClick={() => setInterval("monthly")}>Monthly</Button>
            <Button type="button" size="sm" variant={interval === "yearly" ? "default" : "ghost"} onClick={() => setInterval("yearly")}>Yearly</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLAN_CATALOG.map((item) => {
              const price = interval === "monthly" ? item.monthlyPrice : item.yearlyPrice;
              const selected = plan === item.id;
              const Icon = item.id === "starter" ? Scale : item.id === "professional" ? ShieldCheck : Gem;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id)}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-5 text-left transition-all",
                    selected
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2 text-lg font-semibold"><Icon className="h-4 w-4" />{item.name}</div>
                  <div className={cn("mt-1 text-sm", selected ? "text-slate-200" : "text-slate-600")}>{item.summary}</div>
                  <div className={cn("mt-3 text-sm", selected ? "text-slate-300" : "text-slate-500")}>{item.storage}</div>
                  <div className="mt-3 text-3xl font-semibold leading-none">{price}</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-slate-600" />30-day trial</div>
            <div className="mt-1">No charge today. Billing starts only after trial ends. Cancel any time before trial end.</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!selectedPlan}
              onClick={() => {
                const query = new URLSearchParams();
                if (selectedPlan) {
                  query.set("plan", selectedPlan.id);
                }
                query.set("interval", interval);
                router.push(`/onboarding/payment?${query.toString()}`);
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue to payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
