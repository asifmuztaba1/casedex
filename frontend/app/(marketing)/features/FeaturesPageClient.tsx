"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, CalendarClock, FileText, ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

const featureBlocks = [
  {
    titleKey: "features.block1.title",
    descriptionKey: "features.block1.desc",
    icon: BookOpen,
  },
  {
    titleKey: "features.block2.title",
    descriptionKey: "features.block2.desc",
    icon: CalendarClock,
  },
  {
    titleKey: "features.block3.title",
    descriptionKey: "features.block3.desc",
    icon: FileText,
  },
  {
    titleKey: "features.block4.title",
    descriptionKey: "features.block4.desc",
    icon: ShieldCheck,
  },
];

export default function FeaturesPageClient() {
  const { t } = useLocale();

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("features.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("features.title")}
          </CardTitle>
          <CardDescription>
            {t("features.subtitle")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {featureBlocks.map((feature) => (
          <Card key={feature.titleKey} className="h-full">
            <CardHeader className="space-y-3">
              <feature.icon className="h-5 w-5 text-[var(--muted-soft)]" />
              <CardTitle className="text-base">
                {t(feature.titleKey)}
              </CardTitle>
              <CardDescription>{t(feature.descriptionKey)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            titleKey: "features.extra1.title",
            descriptionKey: "features.extra1.desc",
          },
          {
            titleKey: "features.extra2.title",
            descriptionKey: "features.extra2.desc",
          },
          {
            titleKey: "features.extra3.title",
            descriptionKey: "features.extra3.desc",
          },
        ].map((feature) => (
          <Card key={feature.titleKey} className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t(feature.titleKey)}</CardTitle>
              <CardDescription>{t(feature.descriptionKey)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
