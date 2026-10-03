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
    const key = takeFlashNotice();
    if (key) {
      toast({ title: t(key), variant: "success" });
    }
  }, [t, toast]);

  return null;
}
