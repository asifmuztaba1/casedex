"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { HearingSummary } from "./use-hearings";

const TYPE_BADGE: Record<string, string> = {
  mention: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  hearing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  trial: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  order: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

type Props = {
  hearings: HearingSummary[];
  selectedDate: Date;
};

export default function DayHearingsList({ hearings, selectedDate }: Props) {
  const { t } = useLocale();

  if (hearings.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-6 text-center text-sm text-[var(--muted-soft)]">
        {t("hearings.calendar_empty")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {format(selectedDate, "EEEE, MMMM d, yyyy")}
      </h3>
      <div className="space-y-2">
        {hearings.map((h) => (
          <div
            key={h.public_id}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-3"
          >
            <div className="min-w-[52px] text-xs font-medium text-[var(--muted)]">
              {h.hearing_at ? format(new Date(h.hearing_at), "h:mm a") : "TBD"}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {h.case_public_id ? (
                  <Link
                    href={`/cases/${h.case_public_id}`}
                    className="text-sm font-medium text-[var(--foreground)] hover:underline"
                  >
                    {h.case_title ?? "Untitled case"}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {h.case_title ?? "Untitled case"}
                  </span>
                )}
                {h.type && (
                  <Badge className={TYPE_BADGE[h.type] ?? ""}>
                    {h.type}
                  </Badge>
                )}
              </div>
              {h.agenda && (
                <p className="text-xs text-[var(--muted)] line-clamp-2">{h.agenda}</p>
              )}
              {h.location && (
                <p className="flex items-center gap-1 text-xs text-[var(--muted-soft)]">
                  <MapPin className="h-3 w-3" />
                  {h.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
