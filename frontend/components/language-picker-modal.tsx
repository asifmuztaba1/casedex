"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/locale-provider";
import { useAuth, useUpdateProfile } from "@/features/auth/use-auth";
import type { Locale } from "@/lib/locale";

const PICKER_SHOWN_KEY = "casedex_lang_picker_shown";

export default function LanguagePickerModal() {
  const { setLocale } = useLocale();
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.locale) return;
    if (typeof window !== "undefined" && localStorage.getItem(PICKER_SHOWN_KEY)) return;
    // Small delay so the page renders first
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    if (user) {
      updateProfile.mutate({
        name: user.name,
        email: user.email,
        country_id: user.country_id ?? 1,
        locale,
      });
    }
    localStorage.setItem(PICKER_SHOWN_KEY, "true");
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(PICKER_SHOWN_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 w-72 animate-in slide-in-from-bottom-4 fade-in duration-300 print:hidden">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-lg">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          Choose your language
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          আপনার ভাষা নির্বাচন করুন
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handleSelect("en")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--paper-hover)]"
          >
            English
          </button>
          <button
            onClick={() => handleSelect("bn")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--paper-hover)]"
          >
            বাংলা
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="mt-2 w-full text-center text-xs text-[var(--muted-soft)] hover:text-[var(--muted)]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
