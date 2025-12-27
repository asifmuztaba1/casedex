"use client";

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
import { useAuth, useUpdateProfile } from "@/features/auth/use-auth";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";

export default function ProfileSettingsPage() {
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { t } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryId, setCountryId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setCountryId(user.country_id ? String(user.country_id) : "");
  }, [user]);

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("settings.profile.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("settings.profile.header")}
          </CardTitle>
          <CardDescription>
            {t("settings.profile.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateProfile.mutate({
                name,
                email,
                country_id: Number(countryId),
                password: password || undefined,
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder={t("settings.profile.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <Input
                placeholder={t("settings.profile.email")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                required
              >
                <option value="">{t("settings.profile.country")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder={t("settings.profile.password")}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending
                ? t("settings.profile.save_pending")
                : t("settings.profile.save_button")}
            </Button>
            {updateProfile.isError && (
              <div className="text-sm text-rose-600">
                {t("settings.profile.error")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
