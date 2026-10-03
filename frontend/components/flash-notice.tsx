"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/locale-provider";
import { useToast } from "@/components/ui/use-toast";
import { takeFlashNotice } from "@/lib/flash-notice";

/** Shows a notice left by the previous page (see lib/flash-notice). */
export default function FlashNotice() {
  const { t } = useLocale();
  const { toast } = useToast();

  useEffect(() => {
    // Wait one tick: this effect runs before the root <Toaster> subscribes
    // (child effects first), and a toast sent earlier is dropped. The key is
    // only taken when the toast fires, so StrictMode's re-run can't lose it.
    const timer = window.setTimeout(() => {
      const key = takeFlashNotice();
      if (key) {
        toast({ title: t(key), variant: "success" });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [t, toast]);

  return null;
}
