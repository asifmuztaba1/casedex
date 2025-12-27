"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user && !user.tenant_id) {
      router.replace("/setup");
    }
  }, [isLoading, user, router]);

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

  return <>{children}</>;
}
