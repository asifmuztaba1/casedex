"use client";

import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BillingInterval } from "@/features/billing/types";
import type { PlanCatalogItem } from "@/features/billing/plan-catalog";
import { cn } from "@/lib/utils";

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
  const price = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-slate-200",
        featured && "border-slate-900 shadow-md",
        active && "ring-1 ring-slate-900",
        className
      )}
    >
      {(featured || active || plan.badge) && (
        <div className="absolute right-4 top-4">
          <Badge variant="subtle" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {active ? "Current" : plan.badge ?? "Recommended"}
          </Badge>
        </div>
      )}
      <CardHeader className="space-y-3 pb-4">
        <CardTitle className="text-xl text-slate-900">{plan.name}</CardTitle>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-semibold text-slate-900">{price}</div>
          <div className="pb-1 text-xs uppercase tracking-wide text-slate-500">
            {interval}
          </div>
        </div>
        <CardDescription>{plan.summary}</CardDescription>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          {plan.storage}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
              <span>{feature}</span>
            </div>
          ))}
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
