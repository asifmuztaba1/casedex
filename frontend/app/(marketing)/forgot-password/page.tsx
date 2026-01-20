"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/features/auth/use-auth";
import { useLocale } from "@/components/locale-provider";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            {t("forgot.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("forgot.title")}
          </CardTitle>
          <CardDescription>{t("forgot.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              if (!email.trim()) {
                return;
              }
              forgotPassword.mutate({ email });
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("forgot.email")}
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
            <Button className="w-full" type="submit" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending
                ? t("forgot.button_pending")
                : t("forgot.button")}
            </Button>
            <div className="text-sm text-slate-600">
              <a className="underline-offset-4 hover:underline" href="/login">
                {t("forgot.back_to_login")}
              </a>
            </div>
            {forgotPassword.isError && (
              <div className="text-sm text-rose-600">
                {t("forgot.error")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
