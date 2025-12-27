"use client";

import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for CaseDex.",
};

export default function TermsPage() {
  const { t } = useLocale();

  return (
    <section className="space-y-10">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("terms.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("terms.title")}
          </CardTitle>
          <CardDescription>
            {t("terms.subtitle")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            titleKey: "terms.card1.title",
            descriptionKey: "terms.card1.desc",
          },
          {
            titleKey: "terms.card2.title",
            descriptionKey: "terms.card2.desc",
          },
          {
            titleKey: "terms.card3.title",
            descriptionKey: "terms.card3.desc",
          },
          {
            titleKey: "terms.card4.title",
            descriptionKey: "terms.card4.desc",
          },
        ].map((item) => (
          <Card key={item.titleKey} className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t(item.titleKey)}</CardTitle>
              <CardDescription>{t(item.descriptionKey)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
