"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function SecurityPageClient() {
  const { t } = useLocale();

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("security.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("security.title")}
          </CardTitle>
          <CardDescription>
            {t("security.subtitle")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            titleKey: "security.card1.title",
            descriptionKey: "security.card1.desc",
          },
          {
            titleKey: "security.card2.title",
            descriptionKey: "security.card2.desc",
          },
          {
            titleKey: "security.card3.title",
            descriptionKey: "security.card3.desc",
          },
          {
            titleKey: "security.card4.title",
            descriptionKey: "security.card4.desc",
          },
          {
            titleKey: "security.card5.title",
            descriptionKey: "security.card5.desc",
          },
          {
            titleKey: "security.card6.title",
            descriptionKey: "security.card6.desc",
          },
          {
            titleKey: "security.card7.title",
            descriptionKey: "security.card7.desc",
          },
          {
            titleKey: "security.card8.title",
            descriptionKey: "security.card8.desc",
          },
        ].map((item) => (
          <Card key={item.titleKey} className="h-full">
            <CardHeader className="space-y-3">
              <ShieldCheck className="h-4 w-4 text-[var(--muted-soft)]" />
              <CardTitle className="text-base">{t(item.titleKey)}</CardTitle>
              <CardDescription>{t(item.descriptionKey)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
