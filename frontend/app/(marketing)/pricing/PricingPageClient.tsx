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

export default function PricingPageClient() {
  const { t } = useLocale();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { data: user } = useAuth();
  const checkout = useCheckout();

  const tiers = [
    {
      id: "starter",
      title: "Starter",
      monthlyPrice: "$19",
      yearlyPrice: "$190",
      description: "1 GB storage · Unlimited cases",
    },
    {
      id: "professional",
      title: "Professional",
      monthlyPrice: "$49",
      yearlyPrice: "$490",
      description: "5 GB storage · Audit export",
    },
    {
      id: "chambers",
      title: "Chambers",
      monthlyPrice: "$99",
      yearlyPrice: "$990",
      description: "10 GB storage · Priority support",
    },
  ] as const;

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
        {tiers.map((tier) => (
          <Card key={tier.id} className="h-full">
            <CardHeader className="space-y-3">
              <CardTitle className="text-base">{tier.title}</CardTitle>
              <div className="text-2xl font-semibold text-slate-900">
                {interval === "monthly" ? tier.monthlyPrice : tier.yearlyPrice}
              </div>
              <CardDescription>{tier.description}</CardDescription>
              {user?.tenant_id ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const response = await checkout.mutateAsync({
                      plan: tier.id,
                      interval,
                    });

                    if (response.checkout_url) {
                      window.location.href = response.checkout_url;
                    }
                  }}
                >
                  {t("billing.upgrade")}
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <a href="/register">{t("pricing.cta")}</a>
                </Button>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
