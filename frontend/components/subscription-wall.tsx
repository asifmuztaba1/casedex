"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import { isManualMfsOnlyLaunch } from "@/lib/launch-config";

export default function SubscriptionWall() {
  const { t } = useLocale();

  const onSubscribe = (plan: "starter" | "professional" | "chambers") => {
    const target = isManualMfsOnlyLaunch()
      ? `/settings/billing?source=manual&plan=${plan}&interval=monthly`
      : `/settings/billing?plan=${plan}&interval=monthly`;

    window.location.assign(target);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-6 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">{t("billing.wall_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            {isManualMfsOnlyLaunch()
              ? "This beta activates subscriptions through a guided bKash / Rocket review flow."
              : t("billing.wall_desc")}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" onClick={() => onSubscribe("starter")}>Starter</Button>
            <Button onClick={() => onSubscribe("professional")}>Professional</Button>
            <Button variant="outline" onClick={() => onSubscribe("chambers")}>Chambers</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
