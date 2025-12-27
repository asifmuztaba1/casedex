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
  title: "Privacy Policy",
  description: "Privacy practices for CaseDex.",
};

export default function PrivacyPage() {
  const { t } = useLocale();

  return (
    <section className="space-y-10">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("privacy.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("privacy.title")}
          </CardTitle>
          <CardDescription>
            {t("privacy.subtitle")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            titleKey: "privacy.card1.title",
            descriptionKey: "privacy.card1.desc",
          },
          {
            titleKey: "privacy.card2.title",
            descriptionKey: "privacy.card2.desc",
          },
          {
            titleKey: "privacy.card3.title",
            descriptionKey: "privacy.card3.desc",
          },
          {
            titleKey: "privacy.card4.title",
            descriptionKey: "privacy.card4.desc",
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
