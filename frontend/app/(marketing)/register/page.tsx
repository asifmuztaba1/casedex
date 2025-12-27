"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/use-auth";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useRegister();
  const { t, locale } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryId, setCountryId] = useState("");

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            {t("register.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("register.title")}
          </CardTitle>
          <CardDescription>
            {t("register.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              registerUser.mutate(
                {
                  name,
                  email,
                  password,
                  password_confirmation: confirm,
                  country_id: Number(countryId),
                  locale,
                },
                {
                  onSuccess: () => {
                    router.push("/setup");
                  },
                }
              );
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("register.name")}
              </label>
              <Input
                placeholder={t("register.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("register.email")}
              </label>
              <Input
                placeholder="you@firm.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("register.country")}
              </label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                required
              >
                <option value="">{t("register.country_select")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("register.password")}
              </label>
              <Input
                placeholder="********"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("register.password_confirm")}
              </label>
              <Input
                placeholder="********"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button className="w-full" type="submit" disabled={registerUser.isPending}>
                {registerUser.isPending
                  ? t("register.button_pending")
                  : t("register.button")}
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <a href="/login">{t("register.have_account")}</a>
              </Button>
            </div>
            {registerUser.isError && (
              <div className="text-sm text-rose-600">
                {t("register.error")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
