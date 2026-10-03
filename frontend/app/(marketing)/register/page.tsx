"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/use-auth";
import { useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";
import { formatCountryLabel } from "@/features/countries/country-label";
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerUser = useRegister();
  const { t, locale } = useLocale();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);
  const [name, setName] = useState("");
  // Prefilled when arriving from the homepage "request access" form.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryId, setCountryId] = useState("");
  // Private beta: prefilled from the admin's sign-up link (?invite=CODE).
  const [inviteCode, setInviteCode] = useState(() => searchParams.get("invite") ?? "");
  const [submitted, setSubmitted] = useState(false);
  const { data: registration } = useQuery({
    queryKey: ["registration-mode"],
    queryFn: () => apiGet<{ data: { mode: "invite" | "open" } }>("/api/v1/auth/registration"),
  });
  const inviteRequired = registration?.data.mode === "invite";
  const inviteError = submitted && inviteRequired && !inviteCode.trim();

  const nameError = submitted && !name.trim();
  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = submitted && !password.trim();
  const confirmError = submitted && !confirm.trim();
  const countryError = submitted && !countryId;
  const mismatchError = !!(password && confirm && password !== confirm);
  const passwordTooShort = password.length > 0 && password.length < 8;

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted-soft)]">{t("register.kicker")}</p>
          <CardTitle className="text-2xl font-semibold">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.trial_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            // Before the app has loaded, a native submit must never put the password in the URL.
            method="post"
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
                (inviteRequired && !inviteCode.trim()) ||
                password !== confirm ||
                password.length < 8
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
                  ...(inviteRequired ? { invite_code: inviteCode.trim() } : {}),
                });

                router.push("/onboarding/account");
              } catch {
                // toast handled by hook
              }
            }}
          >
            {inviteRequired && (
              <div className="space-y-2">
                <label htmlFor="register-invite" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("register.invite_code")}
                </label>
                <Input
                  id="register-invite"
                  name="invite_code"
                  autoComplete="off"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  aria-invalid={!!inviteError}
                />
                {inviteError ? (
                  <p className="text-xs text-rose-600">{t("common.required")}</p>
                ) : (
                  <p className="text-xs text-[var(--muted-soft)]">
                    {t("register.invite_hint")}{" "}
                    <a className="underline-offset-4 hover:underline" href="/contact">{t("register.invite_request")}</a>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="register-name" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("register.name")}</label>
              <Input
                id="register-name"
                placeholder={t("register.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={!!nameError}
              />
              {nameError && <p className="text-xs text-rose-600">{t("common.required")}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="register-email" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("register.email")}</label>
              <Input
                id="register-email"
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
              <label htmlFor="register-country" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("register.country")}</label>
              <select
                id="register-country"
                className={`h-10 w-full rounded-lg border bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] ${
                  countryError ? "border-rose-500 focus-visible:ring-rose-500" : "border-[var(--border)]"
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
              <label htmlFor="register-password" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("register.password")}</label>
              <Input
                id="register-password"
                placeholder="********"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={!!(passwordError || mismatchError || passwordTooShort)}
              />
              {passwordError ? (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              ) : passwordTooShort ? (
                <p className="text-xs text-rose-600">{t("common.password_too_short")}</p>
              ) : (
                <p className="text-xs text-[var(--muted-soft)]">{t("common.password_hint")}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="register-password-confirm" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("register.password_confirm")}</label>
              <Input
                id="register-password-confirm"
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
                {registerUser.isPending ? t("register.creating") : t("register.button")}
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <a href="/login">{t("register.have_account")}</a>
              </Button>
            </div>

            {registerUser.isError && (
              <div role="alert" className="text-sm text-rose-600">
                {registerUser.error.message || t("register.error")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
