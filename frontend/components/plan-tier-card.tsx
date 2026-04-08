"use client";

import { Check, ShieldCheck, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BillingInterval } from "@/features/billing/types";
import type { PlanCatalogItem } from "@/features/billing/plan-catalog";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { useIsBdtPricing } from "@/lib/use-locale-currency";

type PlanTierCardProps = {
  plan: PlanCatalogItem;
  interval: BillingInterval;
  ctaLabel: string;
  onCta?: () => void;
  ctaHref?: string;
  featured?: boolean;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function PlanTierCard({
  plan,
  interval,
  ctaLabel,
  onCta,
  ctaHref,
  featured = false,
  active = false,
  disabled = false,
  className,
}: PlanTierCardProps) {
  const { t } = useLocale();
  const isBdt = useIsBdtPricing();
  const price = isBdt
    ? (interval === "monthly" ? plan.monthlyPriceBdt : plan.yearlyPriceBdt)
    : (interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice);
  const accentStyles = {
    slate: "before:bg-[var(--muted)]/80",
    indigo: "before:bg-indigo-700/80",
    teal: "before:bg-teal-700/80",
  } as const;

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-[var(--border)] before:absolute before:inset-x-0 before:top-0 before:h-1",
        accentStyles[plan.accent],
        featured && "border-[var(--foreground)] shadow-md",
        active && "ring-1 ring-[var(--foreground)]",
        className
      )}
    >
      {(featured || active || plan.badge) && (
        <div className="absolute right-4 top-4">
          <Badge variant="subtle" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {active ? t("billing.current_plan_badge") : plan.badge ?? "Recommended"}
          </Badge>
        </div>
      )}
      <CardHeader className="space-y-3 pb-4">
        <CardTitle className="text-xl text-[var(--foreground)]">{plan.name}</CardTitle>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-semibold text-[var(--foreground)]">{price}</div>
          <div className="pb-1 text-xs uppercase tracking-wide text-[var(--muted-soft)]">
            {interval}
          </div>
        </div>
        <CardDescription>{plan.summary}</CardDescription>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm font-medium text-[var(--muted)]">
          {plan.storage}
        </div>
        <div className="text-xs font-medium text-[var(--muted-soft)]">
          {t("billing.best_for")}: {plan.bestFor}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
            {t("billing.feature_snapshot")}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">{t("billing.storage")}</span>
              <span className="font-medium text-[var(--foreground)]">{plan.storage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">{t("billing.audit_export_label")}</span>
              <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                {plan.auditExport ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <X className="h-3.5 w-3.5 text-[var(--muted-soft)]" />
                )}
                {plan.auditExport ? t("billing.included") : t("billing.not_included")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">{t("billing.priority_support_label")}</span>
              <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                {plan.prioritySupport ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <X className="h-3.5 w-3.5 text-[var(--muted-soft)]" />
                )}
                {plan.prioritySupport ? t("billing.included") : t("billing.not_included")}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm text-[var(--muted)]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--foreground)]" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] px-3 py-3 text-xs text-[var(--muted)]">
          <div>{t("billing.trial_notice_line1")}</div>
          <div>{t("billing.trial_notice_line2")}</div>
          <div>{t("billing.trial_notice_line3")}</div>
        </div>

        {ctaHref ? (
          <Button asChild className="w-full" variant={featured ? "default" : "outline"}>
            <a href={ctaHref}>{ctaLabel}</a>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={featured ? "default" : "outline"}
            onClick={onCta}
            disabled={disabled}
          >
            {ctaLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
