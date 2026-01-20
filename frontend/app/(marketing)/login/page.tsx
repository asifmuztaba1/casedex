"use client";

import { useState } from "react";
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
import { useLogin } from "@/features/auth/use-auth";
import { useLocale } from "@/components/locale-provider";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = submitted && !password.trim();

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            {t("login.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("login.header")}
          </CardTitle>
          <CardDescription>
            {t("login.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              if (!email.trim() || !password.trim()) {
                return;
              }
              login.mutate(
                { email, password },
                {
                  onSuccess: () => {
                    router.push("/dashboard");
                  },
                }
              );
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("login.email")}
              </label>
              <Input
                placeholder="you@firm.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                {t("login.password")}
              </label>
              <Input
                placeholder="********"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={passwordError}
              />
              {passwordError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <div className="text-right text-sm text-slate-600">
              <a className="underline-offset-4 hover:underline" href="/forgot-password">
                {t("login.forgot_password")}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <Button className="w-full" type="submit" disabled={login.isPending}>
                {login.isPending
                  ? t("login.button_pending")
                  : t("login.button")}
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <a href="/register">{t("login.create_account")}</a>
              </Button>
            </div>
            {login.isError && (
              <div className="text-sm text-rose-600">
                {t("login.error")}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
