"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { formatCountryLabel } from "@/features/countries/country-label";
import type { BillingInterval } from "@/features/billing/types";
import { PLAN_CATALOG, type PlanId } from "@/features/billing/plan-catalog";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const initialPlan = (searchParams.get("plan") as PlanId) || "professional";
  const initialInterval = (searchParams.get("interval") as BillingInterval) || "monthly";
  const [plan, setPlan] = useState<PlanId>(
    PLAN_CATALOG.some((item) => item.id === initialPlan)
      ? initialPlan
      : "professional"
  );
  const [interval, setInterval] = useState<BillingInterval>(
    initialInterval === "yearly" ? "yearly" : "monthly"
  );
  const [submitted, setSubmitted] = useState(false);

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
                    router.push(`/setup?plan=${plan}&interval=${interval}`);
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
                aria-invalid={!!(nameError)}
              />
              {nameError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
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
                aria-invalid={!!(!!(emailError || emailInvalid))}
              />
              {emailError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
              {emailInvalid && (
                <p className="text-xs text-rose-600">{t("common.invalid_email")}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("register.country")}
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
                <option value="">{t("register.country_select")}</option>
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
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("register.subscription_package")}
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={interval === "monthly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInterval("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button
                    type="button"
                    variant={interval === "yearly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInterval("yearly")}
                  >
                    Yearly
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {PLAN_CATALOG.map((item) => {
                  const isSelected = plan === item.id;
                  const amount =
                    interval === "monthly" ? item.monthlyPrice : item.yearlyPrice;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPlan(item.id)}
                      className={cn(
                        "w-full rounded-xl border bg-white p-4 text-left transition",
                        isSelected
                          ? "border-slate-900 ring-1 ring-slate-900"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-600">{item.storage}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-slate-900">
                            {amount}
                          </div>
                          <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            {interval}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">{item.summary}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                        <Check className="h-3.5 w-3.5" />
                        Unlimited cases and team members
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px]">
                          {t("billing.audit_export_label")}: {item.auditExport ? t("billing.included") : t("billing.not_included")}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px]">
                          {t("billing.priority_support_label")}: {item.prioritySupport ? t("billing.included") : t("billing.not_included")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-700">
                <div>{t("billing.trial_notice_line1")}</div>
                <div>{t("billing.trial_notice_line2")}</div>
                <div>{t("billing.trial_notice_line3")}</div>
              </div>
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
                aria-invalid={!!(!!(passwordError || mismatchError))}
              />
              {passwordError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
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
                aria-invalid={!!(!!(confirmError || mismatchError))}
              />
              {confirmError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
              {mismatchError && (
                <p className="text-xs text-rose-600">{t("common.password_mismatch")}</p>
              )}
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
