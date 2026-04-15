"use client";

import { useAuth } from "@/features/auth/use-auth";

export function useIsBdtPricing(): boolean {
  const { data: user } = useAuth();
  return user?.country_code === "BD";
}
