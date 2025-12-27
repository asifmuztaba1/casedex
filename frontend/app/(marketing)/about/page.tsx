"use client";

import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";

export const metadata: Metadata = {
  title: "About CaseDex",
  description:
    "CaseDex is a structured case workspace for legal professionals and law students.",
};

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("about.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("about.title")}
          </CardTitle>
          <CardDescription>
            {t("about.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div>{t("about.body1")}</div>
          <div>{t("about.body2")}</div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            titleKey: "about.card1.title",
            descriptionKey: "about.card1.desc",
          },
          {
            titleKey: "about.card2.title",
            descriptionKey: "about.card2.desc",
          },
          {
            titleKey: "about.card3.title",
            descriptionKey: "about.card3.desc",
          },
          {
            titleKey: "about.card4.title",
            descriptionKey: "about.card4.desc",
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
