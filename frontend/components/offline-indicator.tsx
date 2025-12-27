"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
      {t("offline.mode")}
    </div>
  );
}

