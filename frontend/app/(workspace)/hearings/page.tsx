"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { useLocale } from "@/components/locale-provider";
import { useAuth, useUsers } from "@/features/auth/use-auth";
import { useHearings } from "@/features/hearings/use-hearings";
import { useCalendarHearings } from "@/features/hearings/use-calendar-hearings";
import MonthCalendar from "@/features/hearings/month-calendar";
import DayHearingsList from "@/features/hearings/day-hearings-list";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, List, CalendarDays } from "lucide-react";

const typeOptions = ["all", "mention", "hearing", "trial", "order"] as const;
const VIEW_KEY = "casedex-hearings-view";

type ViewMode = "list" | "calendar";

export default function HearingsPage() {
  const { t } = useLocale();
  const { data: user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "platform_admin";
  const { data: usersData } = useUsers(isAdmin);
  const tenantUsers = usersData ?? [];

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) || "list";
    }
    return "list";
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode]);

  // List view data
  const { data: listData, isLoading: listLoading, isError: listError } = useHearings();
  const hearings = listData?.data ?? [];

  // Calendar view data
  const calFrom = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const calTo = format(endOfMonth(currentMonth), "yyyy-MM-dd");
  const { data: calData, isLoading: calLoading } = useCalendarHearings(
    { from: calFrom, to: calTo, userPublicId: userFilter !== "all" ? userFilter : null },
    viewMode === "calendar"
  );
  const calendarHearings = calData?.data ?? [];

  // List filtering
  const filtered = useMemo(() => {
    return hearings.filter((h) => {
      const matchesSearch =
        !search ||
        (h.case_title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (h.agenda ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || h.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [hearings, search, typeFilter]);

  const upcoming = useMemo(
    () => filtered.filter((h) => h.hearing_at && new Date(h.hearing_at) >= new Date()),
    [filtered]
  );
  const past = useMemo(
    () => filtered.filter((h) => !h.hearing_at || new Date(h.hearing_at) < new Date()),
    [filtered]
  );

  // Day detail for calendar
  const selectedDayHearings = useMemo(() => {
    if (!selectedDate) return [];
    return calendarHearings.filter(
      (h) => h.hearing_at && isSameDay(new Date(h.hearing_at), selectedDate)
    );
  }, [calendarHearings, selectedDate]);

  const isLoading = viewMode === "list" ? listLoading : calLoading;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("hearings.title")}
        description={t("hearings.subtitle")}
      />

      <div className="flex flex-wrap items-center gap-3">
        {viewMode === "list" && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-soft)]" />
              <Input
                className="w-[260px] pl-9"
                placeholder={t("hearings.search_placeholder") ?? "Search hearings..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "all" ? t("status.all") : t(`hearing.type.${opt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {viewMode === "calendar" && isAdmin && tenantUsers.length > 1 && (
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

        <div className="ml-auto flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            aria-label={t("hearings.view_list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            aria-label={t("hearings.view_calendar")}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="space-y-4">
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
        </div>
      ) : listError ? (
        <div className="text-sm text-rose-600">{t("hearings.error")}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("hearings.empty_title")}
          description={t("hearings.empty_desc")}
          action={
            <Button asChild>
              <Link href="/cases">{t("hearings.action")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
                  {t("dashboard.section.hearings")}
                </h2>
                <HearingTable hearings={upcoming} t={t} />
              </CardContent>
            </Card>
          )}

          {past.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-4 text-base font-semibold text-[var(--muted-soft)]">
                  {t("hearings.past") ?? "Past hearings"}
                </h2>
                <HearingTable hearings={past} t={t} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}

function HearingTable({
  hearings,
  t,
}: {
  hearings: Array<{
    public_id: string;
    case_public_id?: string | null;
    case_title?: string | null;
    hearing_at: string | null;
    type: string | null;
    agenda: string | null;
    next_steps: string | null;
  }>;
  t: (key: string) => string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.date")}</TableHead>
          <TableHead>{t("table.case")}</TableHead>
          <TableHead>{t("table.type")}</TableHead>
          <TableHead>{t("hearing.agenda") ?? "Agenda"}</TableHead>
          <TableHead>{t("hearing.next_steps")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hearings.map((hearing) => (
          <TableRow key={hearing.public_id}>
            <TableCell className="whitespace-nowrap">
              {hearing.hearing_at
                ? format(new Date(hearing.hearing_at), "PP p")
                : t("common.tbd")}
            </TableCell>
            <TableCell>
              {hearing.case_public_id ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/cases/${hearing.case_public_id}`}>
                    {hearing.case_title ?? t("common.view_case")}
                  </Link>
                </Button>
              ) : (
                hearing.case_title ?? "-"
              )}
            </TableCell>
            <TableCell>
              <StatusBadge
                status={hearing.type ?? "hearing"}
                label={t(`hearing.type.${hearing.type ?? "hearing"}`)}
              />
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {hearing.agenda ?? "-"}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {hearing.next_steps ?? "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
