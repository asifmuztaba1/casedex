"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth, useCreateTenant } from "@/features/auth/use-auth";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";
import { formatCountryLabel } from "@/features/countries/country-label";
import { useCheckout } from "@/features/billing/use-billing";
import type { BillingInterval } from "@/features/billing/types";
import type { PlanId } from "@/features/billing/plan-catalog";
import { useToast } from "@/components/ui/use-toast";

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useAuth();
  const createTenant = useCreateTenant();
  const checkout = useCheckout();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);
  const [tenantName, setTenantName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const selectedPlan = (searchParams.get("plan") as PlanId) || "professional";
  const selectedInterval = (searchParams.get("interval") as BillingInterval) || "monthly";

  const nameError = submitted && !tenantName.trim();
  const countryError = submitted && !countryId;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tenant_id) {
      if (user.tenant?.has_active_subscription === false) {
        router.replace("/settings/billing?onboarding=1");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {t("setup.loading")}
      </div>
    );
  }

  if (!user || user.tenant_id) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            {t("setup.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("setup.header")}
          </CardTitle>
          <CardDescription>
            {t("setup.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              if (!tenantName.trim() || !countryId) {
                return;
              }
              createTenant.mutate(
                {
                  tenant_name: tenantName,
                  country_id: Number(countryId),
                  locale,
                },
                {
                  onSuccess: async () => {
                    try {
                      const redirectUrl = `${window.location.origin}/dashboard?billing=success`;
                      const response = await checkout.mutateAsync({
                        plan: selectedPlan,
                        interval: selectedInterval,
                        redirect_url: redirectUrl,
                      });

                      if (response.checkout_url) {
                        window.location.href = response.checkout_url;
                        return;
                      }
                    } catch (error) {
                      toast({
                        title: "Checkout could not start",
                        description: error instanceof Error ? error.message : "Please select package from billing page.",
                        variant: "error",
                      });
                    }

                    router.push("/settings/billing?onboarding=1");
                  },
                }
              );
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("setup.country")}
              </label>
              <select
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 ${
                  countryError
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "border-slate-200"
                }`}
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                required
                aria-invalid={!!(countryError)}
              >
                <option value="">{t("setup.country_select")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id} disabled={!country.active}>
                    {formatCountryLabel(country, t)}
                  </option>
                ))}
              </select>
              {countryError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("setup.firm_name")}
              </label>
              <Input
                placeholder={t("setup.firm_placeholder")}
                value={tenantName}
                onChange={(event) => setTenantName(event.target.value)}
                aria-invalid={!!(nameError)}
              />
              {nameError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <Button type="submit" disabled={createTenant.isPending || checkout.isPending}>
              {createTenant.isPending || checkout.isPending
                ? "Preparing checkout..."
                : t("setup.button")}
            </Button>
            {createTenant.isError && (
              <div className="text-sm text-rose-600">
                {t("setup.error")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
