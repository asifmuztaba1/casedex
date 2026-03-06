"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCheckout } from "@/features/billing/use-billing";
import { useLocale } from "@/components/locale-provider";
import { useToast } from "@/components/ui/use-toast";

export default function SubscriptionWall() {
  const checkout = useCheckout();
  const { t } = useLocale();
  const { toast } = useToast();

  const onSubscribe = async (plan: "starter" | "professional" | "chambers") => {
    try {
      const response = await checkout.mutateAsync({
        plan,
        interval: "monthly",
      });

      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to start checkout.",
        variant: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-6 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">{t("billing.wall_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("billing.wall_desc")}</p>
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
