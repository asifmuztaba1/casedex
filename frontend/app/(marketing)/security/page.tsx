"use client";

import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export const metadata: Metadata = {
  title: "Security",
  description: "Security practices for CaseDex.",
};

export default function SecurityPage() {
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
        ].map((item) => (
          <Card key={item.titleKey} className="h-full">
            <CardHeader className="space-y-3">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">{t(item.titleKey)}</CardTitle>
              <CardDescription>{t(item.descriptionKey)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
