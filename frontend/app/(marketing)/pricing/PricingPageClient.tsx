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
import { useCheckout } from "@/features/billing/use-billing";
import { PLAN_CATALOG } from "@/features/billing/plan-catalog";
import PlanTierCard from "@/components/plan-tier-card";
import { useToast } from "@/components/ui/use-toast";

export default function PricingPageClient() {
  const { t } = useLocale();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { data: user } = useAuth();
  const checkout = useCheckout();
  const { toast } = useToast();

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
            ctaLabel={user?.tenant_id ? t("billing.upgrade") : t("pricing.cta")}
            ctaHref={user?.tenant_id ? undefined : "/register"}
            onCta={
              user?.tenant_id
                ? async () => {
                    try {
                      const response = await checkout.mutateAsync({
                        plan: plan.id,
                        interval,
                      });

                      if (response.checkout_url) {
                        window.location.href = response.checkout_url;
                      }
                    } catch (error) {
                      toast({
                        title: "Checkout failed",
                        description: error instanceof Error ? error.message : "Unable to start checkout.",
                        variant: "error",
                      });
                    }
                  }
                : undefined
            }
            disabled={checkout.isPending}
          />
        ))}
      </div>
    </section>
  );
}
