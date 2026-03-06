"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StorageMeter from "@/components/storage-meter";
import PlanTierCard from "@/components/plan-tier-card";
import {
  useBillingPortal,
  useCancelSubscription,
  useChangePlan,
  useCheckout,
  useInvoices,
  useResumeSubscription,
  useSubscription,
} from "@/features/billing/use-billing";
import type { BillingInterval } from "@/features/billing/types";
import { useLocale } from "@/components/locale-provider";
import { PLAN_CATALOG, STORAGE_ADDON_FEATURES } from "@/features/billing/plan-catalog";

export default function BillingSettingsPage() {
  const { t } = useLocale();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const { data: subscription } = useSubscription();
  const { data: invoices = [] } = useInvoices();
  const checkout = useCheckout();
  const changePlan = useChangePlan();
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();
  const portal = useBillingPortal();

  const trialText = useMemo(() => {
    if (!subscription?.trial_ends_at) {
      return null;
    }

    return formatDistanceToNowStrict(new Date(subscription.trial_ends_at), {
      addSuffix: true,
    });
  }, [subscription?.trial_ends_at]);

  const onSelectPlan = async (plan: "starter" | "professional" | "chambers") => {
    if (!subscription || subscription.status === "expired" || subscription.on_trial) {
      const response = await checkout.mutateAsync({ plan, interval });
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
      return;
    }

    await changePlan.mutateAsync({ plan, interval });
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("billing.title")}</CardTitle>
          <CardDescription>{t("billing.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{subscription?.plan ?? "trial"}</Badge>
            <Badge variant="outline">{subscription?.status ?? "on_trial"}</Badge>
            {trialText && <span className="text-xs text-slate-500">{t("billing.trial_ends")}: {trialText}</span>}
          </div>
          {subscription?.plan_limits && (
            <StorageMeter
              usedBytes={subscription.plan_limits.storage_used_bytes}
              limitBytes={subscription.plan_limits.storage_limit_bytes}
              hasUnlimitedStorage={subscription.plan_limits.has_unlimited_storage}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const response = await portal.mutateAsync();
                if (response.portal_url) {
                  window.location.href = response.portal_url;
                }
              }}
            >
              {t("billing.manage_portal")}
            </Button>
            <Button
              variant="outline"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              {t("billing.cancel")}
            </Button>
            <Button onClick={() => resume.mutate()} disabled={resume.isPending}>
              {t("billing.resume")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.change_plan")}</CardTitle>
          <CardDescription>{t("billing.choose_plan")}</CardDescription>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant={interval === "monthly" ? "default" : "outline"}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </Button>
            <Button
              type="button"
              size="sm"
              variant={interval === "yearly" ? "default" : "outline"}
              onClick={() => setInterval("yearly")}
            >
              Yearly
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {PLAN_CATALOG.map((plan) => (
            <PlanTierCard
              key={plan.id}
              plan={plan}
              interval={interval}
              featured={plan.id === "professional"}
              active={subscription?.plan === plan.id}
              ctaLabel={subscription?.plan === plan.id ? "Current plan" : t("billing.upgrade")}
              onCta={() => onSelectPlan(plan.id)}
              disabled={
                checkout.isPending ||
                changePlan.isPending ||
                subscription?.plan === plan.id
              }
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unlimited storage add-on</CardTitle>
          <CardDescription>Available on any tier when your team needs unrestricted uploads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {STORAGE_ADDON_FEATURES.map((feature) => (
              <div key={feature} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {feature}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              const response = await checkout.mutateAsync({
                plan: "starter",
                interval,
                add_unlimited_storage: true,
              });
              if (response.checkout_url) {
                window.location.href = response.checkout_url;
              }
            }}
            disabled={checkout.isPending}
          >
            Buy unlimited storage
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.invoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-sm text-slate-500">{t("billing.no_invoices")}</div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                  <div>
                    <div className="font-medium">#{invoice.order_number}</div>
                    <div className="text-xs text-slate-500">{new Date(invoice.ordered_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{invoice.total / 100} {invoice.currency.toUpperCase()}</span>
                    {invoice.receipt_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={invoice.receipt_url} target="_blank" rel="noreferrer">Receipt</a>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
