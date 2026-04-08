"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Scale } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useAuth } from "@/features/auth/use-auth";
import { PLAN_CATALOG } from "@/features/billing/plan-catalog";
import PlanTierCard from "@/components/plan-tier-card";
import { isManualMfsOnlyLaunch } from "@/lib/launch-config";
import { useIsBdtPricing } from "@/lib/use-locale-currency";

export default function PricingPageClient() {
  const { t } = useLocale();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { data: user } = useAuth();
  const isBdt = useIsBdtPricing();

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("pricing.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("pricing.title")}
          </CardTitle>
          <CardDescription>{t("pricing.subtitle")}</CardDescription>
          {isBdt && (
            <p className="text-xs text-[var(--muted-soft)]">{t("pricing.bdt_note")}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant={interval === "monthly" ? "default" : "outline"}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </Button>
            <Button
              size="sm"
              variant={interval === "yearly" ? "default" : "outline"}
              onClick={() => setInterval("yearly")}
            >
              Yearly
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_CATALOG.map((plan) => (
          <PlanTierCard
            key={plan.id}
            plan={plan}
            interval={interval}
            featured={plan.id === "professional"}
            ctaLabel={
              user?.tenant_id
                ? (isManualMfsOnlyLaunch() ? "Open billing details" : t("billing.upgrade"))
                : t("pricing.cta")
            }
            ctaHref={
              user?.tenant_id
                ? (isManualMfsOnlyLaunch()
                    ? `/settings/billing?source=manual&plan=${plan.id}&interval=${interval}`
                    : `/settings/billing?plan=${plan.id}&interval=${interval}`)
                : `/register?plan=${plan.id}&interval=${interval}`
            }
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-3">
            <Smartphone className="h-5 w-5 text-[var(--muted-soft)]" />
            <CardTitle className="text-base">{t("pricing.mfs_title")}</CardTitle>
            <CardDescription>{t("pricing.mfs_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm font-semibold text-[#E2136E]">
                bKash
              </div>
              <div className="flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm font-semibold text-[#F6921E]">
                Nagad
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <Scale className="h-5 w-5 text-[var(--muted-soft)]" />
            <CardTitle className="text-base">{t("pricing.bd_courts")}</CardTitle>
            <CardDescription>{t("pricing.bd_courts_desc")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
