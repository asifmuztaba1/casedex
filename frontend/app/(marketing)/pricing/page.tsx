"use client";

import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export const metadata: Metadata = {
  title: "CaseDex Pricing",
  description: "Transparent plans for legal teams, chambers, and students.",
};

export default function PricingPage() {
  const { t } = useLocale();

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("pricing.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("pricing.title")}
          </CardTitle>
          <CardDescription>
            {t("pricing.subtitle")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            titleKey: "pricing.free.title",
            descriptionKey: "pricing.free.desc",
          },
          {
            titleKey: "pricing.pro.title",
            descriptionKey: "pricing.pro.desc",
          },
          {
            titleKey: "pricing.chambers.title",
            descriptionKey: "pricing.chambers.desc",
          },
        ].map((tier) => (
          <Card key={tier.titleKey} className="h-full">
            <CardHeader className="space-y-3">
              <CardTitle className="text-base">{t(tier.titleKey)}</CardTitle>
              <CardDescription>{t(tier.descriptionKey)}</CardDescription>
              <Button variant="outline" size="sm" asChild>
                <a href="/login">{t("pricing.cta")}</a>
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
