"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

export default function SetupPage() {
  const router = useRouter();
  const { data: user, isLoading } = useAuth();
  const createTenant = useCreateTenant();
  const { t, locale } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);
  const [tenantName, setTenantName] = useState("");
  const [countryId, setCountryId] = useState("");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {t("setup.loading")}
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (user.tenant_id) {
    router.replace("/dashboard");
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
              createTenant.mutate(
                {
                  tenant_name: tenantName,
                  country_id: Number(countryId),
                  locale,
                },
                {
                  onSuccess: () => {
                    router.push("/dashboard");
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
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                required
              >
                <option value="">{t("setup.country_select")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("setup.firm_name")}
              </label>
              <Input
                placeholder={t("setup.firm_placeholder")}
                value={tenantName}
                onChange={(event) => setTenantName(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={createTenant.isPending}>
              {createTenant.isPending
                ? t("setup.button_pending")
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
