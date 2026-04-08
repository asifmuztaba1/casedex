"use client";

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
import { type AuthUser, useAuth, useUpdateProfile } from "@/features/auth/use-auth";
import { type CountryOption, useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";
import { formatCountryLabel } from "@/features/countries/country-label";

export default function ProfileSettingsPage() {
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);

  if (!user) {
    return null;
  }

  return (
    <ProfileSettingsForm
      key={user.public_id}
      user={user}
      countries={countries}
      updateProfile={updateProfile}
    />
  );
}

function ProfileSettingsForm({
  user,
  countries,
  updateProfile,
}: {
  user: AuthUser;
  countries: CountryOption[];
  updateProfile: ReturnType<typeof useUpdateProfile>;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [countryId, setCountryId] = useState(user.country_id ? String(user.country_id) : "");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim();
  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const countryError = submitted && !countryId;

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
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
              setSubmitted(true);
              if (!name.trim() || !email.trim() || !countryId) {
                return;
              }
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
                aria-invalid={!!nameError}
              />
              {nameError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
              <Input
                placeholder={t("settings.profile.email")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-invalid={!!(emailError || emailInvalid)}
              />
              {emailError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
              {emailInvalid && (
                <p className="text-xs text-rose-600">{t("common.invalid_email")}</p>
              )}
              <select
                className={`h-10 rounded-lg border bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] ${
                  countryError
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "border-[var(--border)]"
                }`}
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                required
                aria-invalid={!!countryError}
              >
                <option value="">{t("settings.profile.country")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id} disabled={!country.active}>
                    {formatCountryLabel(country, t)}
                  </option>
                ))}
              </select>
              {countryError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
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
