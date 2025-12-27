"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";
import { useLocale } from "@/components/locale-provider";

const PLATFORM_ROLES = ["platform_admin", "platform_editor"] as const;

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const { data: user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    if (!PLATFORM_ROLES.includes(user.role as (typeof PLATFORM_ROLES)[number])) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {t("admin.loading")}
      </div>
    );
  }

  if (!user || !PLATFORM_ROLES.includes(user.role as (typeof PLATFORM_ROLES)[number])) {
    return null;
  }

  return <>{children}</>;
}
