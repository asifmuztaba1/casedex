"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin, type AuthUser } from "@/features/auth/use-auth";
import { loginDestination } from "@/features/auth/login-destination";
import { hardNavigate } from "@/lib/hard-navigate";
import { setFlashNotice } from "@/lib/flash-notice";
import { useLocale } from "@/components/locale-provider";

const noSubscription = () => () => {};

export default function LoginPage() {
  const login = useLogin();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  // Arriving from Settings → Delete account (false during server render).
  const accountDeleted = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(window.location.search).get("account_deleted") === "1",
    () => false
  );

  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailError = submitted && !email.trim();
  const emailInvalid = submitted && email.trim().length > 0 && !emailFormatValid;
  const passwordError = submitted && !password.trim();

  const handleLoginSuccess = async (loggedInUser: AuthUser) => {
    setRedirecting(true);

    const dest = loginDestination(loggedInUser);

    // Use the Credential Management API to proactively store the
    // credential. This tells Chrome "we handled it" and suppresses
    // the default "Save password?" popup overlay.
    try {
      const CredCtor = (window as unknown as Record<string, unknown>).PasswordCredential as
        | (new (data: { id: string; password: string }) => Credential)
        | undefined;
      if (CredCtor) {
        const cred = new CredCtor({ id: email, password });
        await navigator.credentials.store(cred);
      }
    } catch {
      // API unavailable (non-Chrome or insecure context) — continue
    }

    // Mark fresh login so workspace overlays (FeedbackTrigger etc.)
    // don't fire immediately.
    try {
      sessionStorage.setItem("casedex_login_at", Date.now().toString());
    } catch {
      // sessionStorage unavailable (e.g. private browsing)
    }

    hardNavigate(dest);
  };

  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted-soft)]">
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
          {accountDeleted && (
            <p role="status" className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--muted)]">
              {t("account_delete.login_notice")}
            </p>
          )}
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              if (!email.trim() || !emailFormatValid || !password.trim()) {
                return;
              }
              login.mutate(
                { email, password },
                {
                  onSuccess: (response) => {
                    if (response.meta?.account_deletion_cancelled) {
                      setFlashNotice("account_delete.cancelled_on_sign_in");
                    }
                    void handleLoginSuccess(response.data);
                  },
                }
              );
            }}
          >
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                {t("login.email")}
              </label>
              <Input
                id="login-email"
                name="email"
                autoComplete="email"
                placeholder="you@firm.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                {t("login.password")}
              </label>
              <Input
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder="********"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={!!(passwordError)}
              />
              {passwordError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <div className="text-right text-sm text-[var(--muted)]">
              <a className="underline-offset-4 hover:underline" href="/forgot-password">
                {t("login.forgot_password")}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <Button className="w-full" type="submit" disabled={login.isPending || redirecting}>
                {redirecting
                  ? t("login.redirecting")
                  : login.isPending
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
