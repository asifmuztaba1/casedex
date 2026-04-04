"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/components/locale-provider";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export default function OfflineIndicator() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { t } = useLocale();

  if (online) {
    return null;
  }

  return (
    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
      {t("offline.mode")}
    </div>
  );
}
