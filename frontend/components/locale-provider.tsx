"use client";

import React from "react";
import type { Locale } from "@/lib/locale-constants";
import { getStoredLocale, setStoredLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = React.createContext<LocaleContextValue | undefined>(
  undefined
);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale ?? "en");

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    setStoredLocale(nextLocale);
  };

  React.useEffect(() => {
    if (!initialLocale) {
      const stored = getStoredLocale();
      if (stored !== locale) {
        setLocaleState(stored);
        return;
      }
    }
    setStoredLocale(locale);
  }, [initialLocale, locale]);

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(locale, key),
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
