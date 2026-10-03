"use client";

import { ShieldAlert } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

/** Features whose output a lawyer must check against official sources. */
const SPECIFIC_WARNING: Record<string, string> = {
  case_law_suggestion: "ai.verify.case_law",
  legal_section_lookup: "ai.verify.legal_sections",
  next_steps: "ai.verify.next_steps",
  petition_draft: "ai.verify.petition",
};

/**
 * Shown with every AI result: it is a draft for the lawyer's review, not
 * legal advice. Higher-risk features add what exactly to check.
 */
export default function AiVerifyNotice({ feature }: { feature: string }) {
  const { t } = useLocale();
  const specific = SPECIFIC_WARNING[feature];

  return (
    <div
      role="note"
      className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold">{t("ai.verify.general")}</p>
        {specific && <p>{t(specific)}</p>}
      </div>
    </div>
  );
}
