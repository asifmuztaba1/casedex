"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourtStats } from "@/features/admin/courts/use-admin-courts";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = countriesData?.data ?? [];
  const [countryId, setCountryId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!countryId && countries.length > 0) {
      const bd = countries.find((country) => country.code === "BD");
      setCountryId(bd?.id ?? countries[0].id);
    }
  }, [countries, countryId]);

  const { data: stats } = useCourtStats(countryId);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("admin.dashboard.kicker")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("admin.dashboard.title")}
          </h1>
          <p className="text-sm text-slate-600">{t("admin.dashboard.subtitle")}</p>
        </div>
        <div className="min-w-[220px]">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("admin.country")}
          </label>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
            value={countryId ?? ""}
            onChange={(event) => setCountryId(Number(event.target.value))}
          >
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.stats.divisions")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {stats?.divisions ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.stats.districts")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {stats?.districts ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.stats.court_types")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {stats?.court_types ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.stats.courts")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {stats?.courts ?? 0}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
