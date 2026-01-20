"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useAuth } from "@/features/auth/use-auth";

export default function SettingsPage() {
  const { t } = useLocale();
  const { data: user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("settings.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("settings.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {t("settings.description")}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{t("settings.profile_card")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
              <p>{t("settings.profile_card_desc")}</p>
            <Button asChild className="mt-3 md-block">
              <Link href="/settings/profile">{t("settings.profile_card_action")}</Link>
            </Button>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{t("settings.team_card")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
                <p>{t("settings.team_card_desc")}</p>
              <Button asChild className="mt-3 md-block">
                <Link href="/settings/team">{t("settings.team_card_action")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

      </div>

    </section>
  );
}
