"use client";

import type { Locale } from "@/lib/locale-constants";
import { STORAGE_KEY } from "@/lib/locale-constants";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "bn" || stored === "en") {
    return stored;
  }
  return "en";
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
