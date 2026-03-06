"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/use-auth";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";
import { formatCountryLabel } from "@/features/countries/country-label";
import type { BillingInterval } from "@/features/billing/types";
import { PLAN_CATALOG, type PlanId } from "@/features/billing/plan-catalog";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerUser = useRegister();
  const { t, locale } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryId, setCountryId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedPlanFromQuery = (searchParams.get("plan") as PlanId) || "professional";
  const selectedIntervalFromQuery = (searchParams.get("interval") as BillingInterval) || "monthly";
  const plan = PLAN_CATALOG.some((item) => item.id === selectedPlanFromQuery)
    ? selectedPlanFromQuery
    : "professional";
  const interval: BillingInterval = selectedIntervalFromQuery === "yearly" ? "yearly" : "monthly";

  const nameError = submitted && !name.trim();
  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = submitted && !password.trim();
  const confirmError = submitted && !confirm.trim();
  const countryError = submitted && !countryId;
  const mismatchError = submitted && password && confirm && password !== confirm;

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t("register.kicker")}</p>
          <CardTitle className="text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription>
            Layer 1 of onboarding: create your user account. Next you will verify email, choose package, and choose payment method.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitted(true);

              if (
                !name.trim() ||
                !email.trim() ||
                !password.trim() ||
                !confirm.trim() ||
                !countryId ||
                password !== confirm
              ) {
                return;
              }

              try {
                await registerUser.mutateAsync({
                  name,
                  email,
                  password,
                  password_confirmation: confirm,
                  country_id: Number(countryId),
                  locale,
                });

                router.push(`/onboarding/account?plan=${plan}&interval=${interval}`);
              } catch {
                // toast handled by hook
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("register.name")}</label>
              <Input
                placeholder={t("register.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={!!nameError}
              />
              {nameError && <p className="text-xs text-rose-600">{t("common.required")}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("register.email")}</label>
              <Input
                placeholder="you@firm.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={!!(emailError || emailInvalid)}
              />
              {emailError && <p className="text-xs text-rose-600">{t("common.required")}</p>}
              {emailInvalid && <p className="text-xs text-rose-600">{t("common.invalid_email")}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("register.country")}</label>
              <select
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 ${
                  countryError ? "border-rose-500 focus-visible:ring-rose-500" : "border-slate-200"
                }`}
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                required
                aria-invalid={!!countryError}
              >
                <option value="">{t("register.country_select")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id} disabled={!country.active}>
                    {formatCountryLabel(country, t)}
                  </option>
                ))}
              </select>
              {countryError && <p className="text-xs text-rose-600">{t("common.required")}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("register.password")}</label>
              <Input
                placeholder="********"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={!!(passwordError || mismatchError)}
              />
              {passwordError && <p className="text-xs text-rose-600">{t("common.required")}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("register.password_confirm")}</label>
              <Input
                placeholder="********"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                aria-invalid={!!(confirmError || mismatchError)}
              />
              {confirmError && <p className="text-xs text-rose-600">{t("common.required")}</p>}
              {mismatchError && <p className="text-xs text-rose-600">{t("common.password_mismatch")}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <Button className="w-full" type="submit" disabled={registerUser.isPending}>
                {registerUser.isPending ? "Creating account..." : "Create account"}
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <a href="/login">{t("register.have_account")}</a>
              </Button>
            </div>

            {registerUser.isError && <div className="text-sm text-rose-600">{t("register.error")}</div>}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
