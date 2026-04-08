"use client";

import type { AiRequest } from "@/features/ai/use-ai";
import { useAiRequestStatus } from "@/features/ai/use-ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

type Props = {
  request: AiRequest | null;
  isPending: boolean;
};

export default function AiResultPanel({ request, isPending }: Props) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const poll = useAiRequestStatus(
    request && (request.status === "queued" || request.status === "running")
      ? request.public_id
      : null
  );

  const current = poll.data ?? request;

  if (!current && !isPending) return null;

  const isLoading =
    isPending ||
    current?.status === "queued" ||
    current?.status === "running";

  const handleCopy = () => {
    if (current?.result_text) {
      navigator.clipboard.writeText(current.result_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="mt-4 border-[var(--border)] bg-[var(--wash)]">
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />
            <span className="text-sm text-[var(--muted)]">{t("ai.processing")}</span>
          </div>
        ) : current?.status === "completed" && current.result_text ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                  {t("ai.result")}
                </span>
                <span className="text-[10px] text-[var(--muted-soft)]">
                  {current.credits_cost} {t("ai.credits_used")}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span className="text-xs">{copied ? t("ai.copied") : t("ai.copy")}</span>
              </Button>
            </div>
            <div className="whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--paper)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
              {current.result_text}
            </div>
          </div>
        ) : current?.status === "failed" ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
            {current.error_message ?? t("ai.error_generic")}
          </div>
        ) : current?.status === "blocked_insufficient_credits" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t("ai.insufficient_credits")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
