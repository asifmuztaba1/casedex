"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin, useAuth } from "@/features/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";
import { useToast } from "@/components/ui/use-toast";

const PLATFORM_ROLES = ["platform_admin", "platform_editor"] as const;
const ADMIN_DEMO_ACCOUNTS = [
  { label: "Platform Admin", email: "platform.admin@casedex.app", password: "password" },
] as const;

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { toast } = useToast();
  const login = useLogin();
  const { data: user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = submitted && !password.trim();

  const loginAsDemo = (demo: (typeof ADMIN_DEMO_ACCOUNTS)[number]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setSubmitted(false);

    login.mutate(
      { email: demo.email, password: demo.password },
      {
        onSuccess: (response) => {
          const role = response.data.role;
          if (PLATFORM_ROLES.includes(role as (typeof PLATFORM_ROLES)[number])) {
            router.replace("/admin");
            return;
          }

          toast({
            title: t("admin.login.access_denied_title"),
            description: t("admin.login.access_denied_desc"),
            variant: "error",
          });
        },
      }
    );
  };

  useEffect(() => {
    if (
      user &&
      PLATFORM_ROLES.includes(user.role as (typeof PLATFORM_ROLES)[number])
    ) {
      router.replace("/admin");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("admin.login.kicker")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("admin.login.title")}
          </h1>
          <p className="text-sm text-slate-600">{t("admin.login.subtitle")}</p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (!email.trim() || !password.trim()) {
              return;
            }
            login.mutate(
              { email, password },
              {
                onSuccess: (response) => {
                  const role = response.data.role;
                  if (
                    PLATFORM_ROLES.includes(
                      role as (typeof PLATFORM_ROLES)[number]
                    )
                  ) {
                    router.replace("/admin");
                    return;
                  }

                  toast({
                    title: t("admin.login.access_denied_title"),
                    description: t("admin.login.access_denied_desc"),
                    variant: "error",
                  });
                },
              }
            );
          }}
        >
          <Input
            type="email"
            placeholder={t("login.email")}
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
          <Input
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            aria-invalid={!!(passwordError)}
          />
          {passwordError && (
            <p className="text-xs text-rose-600">{t("common.required")}</p>
          )}
          <div className="text-right text-sm text-slate-600">
            <a className="underline-offset-4 hover:underline" href="/forgot-password">
              {t("login.forgot_password")}
            </a>
          </div>
          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? t("login.button_pending") : t("admin.login.button")}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Demo platform account</div>
          {ADMIN_DEMO_ACCOUNTS.map((demo) => (
            <div key={demo.email} className="mt-2">
              <div className="text-xs text-slate-600">Email: {demo.email}</div>
              <div className="text-xs text-slate-600">Password: {demo.password}</div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.password);
                    setSubmitted(false);
                  }}
                >
                  Use
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => loginAsDemo(demo)}
                  disabled={login.isPending}
                >
                  Login now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
