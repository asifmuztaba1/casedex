"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { RefreshCcw } from "lucide-react";

export default function ServiceWorkerRegister() {
  const { t } = useLocale();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    let cancelled = false;

    const trackInstallingWorker = (sw: ServiceWorker | null) => {
      if (!sw) return;
      const onStateChange = () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          setWaiting(sw);
        }
      };
      if (sw.state === "installed" && navigator.serviceWorker.controller) {
        setWaiting(sw);
      } else {
        sw.addEventListener("statechange", onStateChange);
      }
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;

        trackInstallingWorker(registration.waiting);

        registration.addEventListener("updatefound", () => {
          trackInstallingWorker(registration.installing);
        });
      })
      .catch(() => {});

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  const apply = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div
      className="fixed left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 print:hidden"
      style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex items-center gap-3">
        <RefreshCcw className="h-4 w-4 text-[var(--muted)]" />
        <span className="text-sm font-medium text-[var(--foreground)]">
          {t("pwa.update_available")}
        </span>
        <Button size="sm" onClick={apply}>
          {t("pwa.update_reload")}
        </Button>
      </div>
    </div>
  );
}
