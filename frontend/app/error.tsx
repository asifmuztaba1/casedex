"use client";

import { useEffect } from "react";
import { translate } from "@/lib/i18n";
import { getStoredLocale } from "@/lib/locale";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Read the stored locale directly: this boundary may render outside the providers.
  const t = (key: string) => translate(getStoredLocale(), key);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--wash)] px-4 text-center">
      <h1 className="text-6xl font-semibold text-[var(--foreground)]">500</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        {t("error.desc")}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] hover:opacity-90"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
