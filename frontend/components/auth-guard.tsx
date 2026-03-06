"use client"

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user && !user.tenant_id) {
      router.replace("/setup");
      return;
    }

    if (
      !isLoading &&
      user?.tenant_id &&
      user?.tenant?.has_active_subscription === false &&
      pathname !== "/settings/billing"
    ) {
      router.replace("/settings/billing?onboarding=1");
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading workspace...
      </div>
    );
  }

  if (!user || !user.tenant_id) {
    return null;
  }

  if (
    user?.tenant_id &&
    user?.tenant?.has_active_subscription === false &&
    pathname !== "/settings/billing"
  ) {
    return null;
  }

  return <>{children}</>;
}
