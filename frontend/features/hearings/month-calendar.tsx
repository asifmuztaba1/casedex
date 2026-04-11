"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import type { HearingSummary } from "./use-hearings";

const TYPE_COLORS: Record<string, string> = {
  mention: "bg-blue-500",
  hearing: "bg-indigo-500",
  trial: "bg-amber-500",
  order: "bg-teal-500",
};

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

type Props = {
  hearings: HearingSummary[];
  currentMonth: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
};

export default function MonthCalendar({
  hearings,
  currentMonth,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: Props) {
  const { t, locale } = useLocale();
  const weekdays = locale === "bn" ? WEEKDAYS_BN : WEEKDAYS_EN;

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const hearingsByDay = useMemo(() => {
    const map = new Map<string, HearingSummary[]>();
    for (const h of hearings) {
      if (!h.hearing_at) continue;
      const key = format(new Date(h.hearing_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(h);
      map.set(key, list);
    }
    return map;
  }, [hearings]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-2 md:p-4">
      <div className="mb-3 flex items-center justify-between md:mb-4">
        <Button variant="outline" size="sm" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-xs font-semibold text-[var(--foreground)] md:text-sm">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          {!isSameMonth(currentMonth, new Date()) && (
            <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>
              {t("hearings.today")}
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {weekdays.map((day) => (
          <div key={day} className="py-1 text-center text-[10px] font-medium text-[var(--muted)] md:py-2 md:text-xs">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayHearings = hearingsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={[
                "relative flex min-h-[48px] flex-col items-center rounded-lg p-1 text-xs transition-colors md:min-h-[72px] md:p-1.5 md:text-sm",
                inMonth ? "text-[var(--foreground)]" : "text-[var(--muted-soft)]",
                selected
                  ? "bg-indigo-100 dark:bg-indigo-900/40"
                  : "hover:bg-[var(--paper-hover)]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium md:h-7 md:w-7 md:text-xs",
                  today ? "bg-indigo-600 text-white" : "",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              {dayHearings.length > 0 && (
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5 md:mt-1">
                  {dayHearings.slice(0, 3).map((h) => (
                    <span
                      key={h.public_id}
                      className={`h-1 w-1 rounded-full md:h-1.5 md:w-1.5 ${TYPE_COLORS[h.type ?? ""] ?? "bg-gray-400"}`}
                    />
                  ))}
                  {dayHearings.length > 3 && (
                    <span className="hidden text-[9px] leading-none text-[var(--muted)] md:inline">
                      +{dayHearings.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
