"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin, useAuth } from "@/features/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";

const PLATFORM_ROLES = ["platform_admin", "platform_editor"] as const;

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const login = useLogin();
  const { data: user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            login.mutate(
              { email, password },
              {
                onSuccess: () => {
                  router.replace("/admin");
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
          />
          <Input
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? t("login.button_pending") : t("admin.login.button")}
          </Button>
        </form>
      </div>
    </div>
  );
}
