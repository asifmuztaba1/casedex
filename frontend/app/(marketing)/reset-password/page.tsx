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
  const mismatchError = submitted && password && confirm && password !== confirm;

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            {t("reset.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("reset.title")}
          </CardTitle>
          <CardDescription>{t("reset.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {missingToken ? (
            <div className="space-y-4 text-sm text-slate-600">
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
                  password !== confirm
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
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("reset.email")}
                </label>
                <Input
                placeholder="you@firm.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-invalid={emailError || emailInvalid}
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
                  {t("reset.password")}
                </label>
                <Input
                  placeholder="********"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  aria-invalid={passwordError || mismatchError}
                />
                {passwordError && (
                  <p className="text-xs text-rose-600">{t("common.required")}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("reset.password_confirm")}
                </label>
                <Input
                  placeholder="********"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  aria-invalid={confirmError || mismatchError}
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
              <div className="text-sm text-slate-600">
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
