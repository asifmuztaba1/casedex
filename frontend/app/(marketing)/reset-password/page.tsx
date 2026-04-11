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
import { useResetPassword } from "@/features/auth/use-auth";
import { useLocale } from "@/components/locale-provider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLocale();
  const resetPassword = useResetPassword();

  const token = params.get("token") ?? "";
  const initialEmail = params.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const missingToken = useMemo(() => !token, [token]);
  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = submitted && !password.trim();
  const confirmError = submitted && !confirm.trim();
  const mismatchError = !!(password && confirm && password !== confirm);
  const passwordTooShort = password.length > 0 && password.length < 8;

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted-soft)]">
            {t("reset.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("reset.title")}
          </CardTitle>
          <CardDescription>{t("reset.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {missingToken ? (
            <div className="space-y-4 text-sm text-[var(--muted)]">
              <p>{t("reset.missing_token")}</p>
              <a className="underline-offset-4 hover:underline" href="/forgot-password">
                {t("reset.request_again")}
              </a>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
                if (
                  !email.trim() ||
                  !password.trim() ||
                  !confirm.trim() ||
                  password !== confirm ||
                  password.length < 8
                ) {
                  return;
                }
                resetPassword.mutate(
                  {
                    email,
                    token,
                    password,
                    password_confirmation: confirm,
                  },
                  {
                    onSuccess: () => {
                      router.push("/login");
                    },
                  }
                );
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("reset.email")}
                </label>
                <Input
                placeholder="you@firm.com"
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
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("reset.password")}
                </label>
                <Input
                  placeholder="********"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
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
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("reset.password_confirm")}
                </label>
                <Input
                  placeholder="********"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  aria-invalid={!!(confirmError || mismatchError)}
                />
                {confirmError && (
                  <p className="text-xs text-rose-600">{t("common.required")}</p>
                )}
                {mismatchError && (
                  <p className="text-xs text-rose-600">
                    {t("common.password_mismatch")}
                  </p>
                )}
              </div>
              <Button className="w-full" type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending
                  ? t("reset.button_pending")
                  : t("reset.button")}
              </Button>
              <div className="text-sm text-[var(--muted)]">
                <a className="underline-offset-4 hover:underline" href="/login">
                  {t("reset.back_to_login")}
                </a>
              </div>
              {resetPassword.isError && (
                <div className="text-sm text-rose-600">
                  {t("reset.error")}
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
