"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/components/locale-provider";
import { useAuth, useUpdateProfile } from "@/features/auth/use-auth";
import type { Locale } from "@/lib/locale";

const PICKER_SHOWN_KEY = "casedex_lang_picker_shown";

export default function LanguagePickerModal() {
  const { setLocale } = useLocale();
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Only show if user hasn't set a locale yet and picker hasn't been shown
    if (user.locale) return;
    if (typeof window !== "undefined" && localStorage.getItem(PICKER_SHOWN_KEY)) return;
    setOpen(true);
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
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        localStorage.setItem(PICKER_SHOWN_KEY, "true");
      }
      setOpen(v);
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Choose your language</DialogTitle>
          <DialogDescription>আপনার ভাষা নির্বাচন করুন</DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSelect("en")}
            className="group flex flex-col items-center gap-3 rounded-xl border-2 border-[var(--border)] bg-[var(--paper)] p-6 transition-all hover:border-[var(--primary)] hover:shadow-md"
          >
            <span className="text-3xl">🇬🇧</span>
            <span className="text-lg font-semibold text-[var(--foreground)]">English</span>
            <span className="text-xs text-[var(--muted)]">Continue in English</span>
          </button>
          <button
            onClick={() => handleSelect("bn")}
            className="group flex flex-col items-center gap-3 rounded-xl border-2 border-[var(--border)] bg-[var(--paper)] p-6 transition-all hover:border-[var(--primary)] hover:shadow-md"
          >
            <span className="text-3xl">🇧🇩</span>
            <span className="text-lg font-semibold text-[var(--foreground)]">বাংলা</span>
            <span className="text-xs text-[var(--muted)]">বাংলায় চালিয়ে যান</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
