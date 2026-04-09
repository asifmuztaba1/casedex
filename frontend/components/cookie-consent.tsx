"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

const COOKIE_CONSENT_KEY = "casedex-cookie-consent";

export default function CookieConsent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--paper)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <p className="text-xs text-[var(--muted)]">{t("cookie.message")}</p>
        <Button size="sm" variant="outline" onClick={accept}>
          {t("cookie.accept")}
        </Button>
      </div>
    </div>
  );
}
