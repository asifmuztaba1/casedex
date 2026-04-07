"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Clock, ShieldAlert, MapPin } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function ContactPageClient() {
  const { t } = useLocale();

  const cards = [
    {
      icon: Mail,
      titleKey: "contact.email_title",
      descriptionKey: "contact.email_desc",
      email: "contact.email_value",
    },
    {
      icon: Clock,
      titleKey: "contact.response_title",
      descriptionKey: "contact.response_desc",
    },
    {
      icon: ShieldAlert,
      titleKey: "contact.security_title",
      descriptionKey: "contact.security_desc",
    },
    {
      icon: MapPin,
      titleKey: "contact.office_title",
      descriptionKey: "contact.office_desc",
    },
  ];

  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">{t("contact.badge")}</Badge>
          <CardTitle className="text-2xl font-semibold">
            {t("contact.title")}
          </CardTitle>
          <CardDescription>{t("contact.subtitle")}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.titleKey} className="h-full">
              <CardHeader className="space-y-3">
                <Icon className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-base">
                  {t(item.titleKey)}
                </CardTitle>
                <CardDescription>
                  {t(item.descriptionKey)}
                  {item.email && (
                    <>
                      <br />
                      <a
                        href={`mailto:${t(item.email)}`}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {t(item.email)}
                      </a>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
