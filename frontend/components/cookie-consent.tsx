"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

const COOKIE_CONSENT_KEY = "casedex-cookie-consent";

export default function CookieConsent({ delayMs = 0 }: { delayMs?: number }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--paper)]/95 backdrop-blur animate-in slide-in-from-bottom fade-in duration-300 lg:bottom-0">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-3 py-3 md:px-6">
        <p className="text-xs text-[var(--muted)]">{t("cookie.message")}</p>
        <Button size="sm" variant="outline" onClick={accept}>
          {t("cookie.accept")}
        </Button>
      </div>
    </div>
  );
}
