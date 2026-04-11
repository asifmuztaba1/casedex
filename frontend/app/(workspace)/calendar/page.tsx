"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import PageHeader from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { useAuth, useUsers } from "@/features/auth/use-auth";
import { useCalendarHearings } from "@/features/hearings/use-calendar-hearings";
import MonthCalendar from "@/features/hearings/month-calendar";
import DayHearingsList from "@/features/hearings/day-hearings-list";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarPage() {
  const { t } = useLocale();
  const { data: user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "platform_admin";
  const { data: usersData } = useUsers(isAdmin);
  const tenantUsers = usersData ?? [];

  const [userFilter, setUserFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calFrom = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const calTo = format(endOfMonth(currentMonth), "yyyy-MM-dd");
  const { data: calData, isLoading } = useCalendarHearings({
    from: calFrom,
    to: calTo,
    userPublicId: userFilter !== "all" ? userFilter : null,
  });
  const calendarHearings = calData?.data ?? [];

  const selectedDayHearings = useMemo(() => {
    if (!selectedDate) return [];
    return calendarHearings.filter(
      (h) => h.hearing_at && isSameDay(new Date(h.hearing_at), selectedDate)
    );
  }, [calendarHearings, selectedDate]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={t("hearings.view_calendar")}
          description={t("hearings.subtitle")}
        />
        {isAdmin && tenantUsers.length > 1 && (
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t("hearings.filter_user")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("hearings.filter_user_all")}</SelectItem>
              {tenantUsers.map((u) => (
                <SelectItem key={u.public_id} value={u.public_id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <MonthCalendar
        hearings={calendarHearings}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onMonthChange={setCurrentMonth}
      />

      {selectedDate ? (
        <DayHearingsList hearings={selectedDayHearings} selectedDate={selectedDate} />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-6 text-center text-sm text-[var(--muted-soft)]">
          {t("hearings.select_day")}
        </div>
      )}
    </section>
  );
}
