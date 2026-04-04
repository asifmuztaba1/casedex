"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useAuth } from "@/features/auth/use-auth";
import { PLAN_CATALOG } from "@/features/billing/plan-catalog";
import PlanTierCard from "@/components/plan-tier-card";
import { isManualMfsOnlyLaunch } from "@/lib/launch-config";

export default function PricingPageClient() {
  const { t } = useLocale();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { data: user } = useAuth();

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("pricing.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("pricing.title")}
          </CardTitle>
          <CardDescription>{t("pricing.subtitle")}</CardDescription>
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
    </section>
  );
}
