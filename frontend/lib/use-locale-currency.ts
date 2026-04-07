"use client";

import { useLocale } from "@/components/locale-provider";

/**
 * Returns true if the user should see BDT pricing.
 * Uses the locale as a proxy — Bangla locale users see BDT.
 */
export function useIsBdtPricing(): boolean {
  const { locale } = useLocale();
  return locale === "bn";
}
