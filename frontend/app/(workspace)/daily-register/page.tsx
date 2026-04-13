"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, addDays, subDays } from "date-fns";
import PageHeader from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { useAuth } from "@/features/auth/use-auth";
import {
  useDailyRegister,
  type DailyRegisterHearing,
} from "@/features/hearings/use-daily-register";
import { useUpdateHearing } from "@/features/hearings/use-hearings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Printer,
} from "lucide-react";

function formatPartiesVs(h: DailyRegisterHearing): string {
  const client = h.client_name || "—";
  const opponent = h.opponent_name || "—";
  return `${client} vs. ${opponent}`;
}

function InlineOutcome({
  hearing,
  field,
  placeholder,
}: {
  hearing: DailyRegisterHearing;
  field: "outcome" | "next_steps";
  placeholder: string;
}) {
  const updateHearing = useUpdateHearing();
  const [value, setValue] = useState(hearing[field] ?? "");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed !== (hearing[field] ?? "")) {
      updateHearing.mutate({
        publicId: hearing.public_id,
        data: { [field]: trimmed || null },
      });
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        className="h-7 min-w-[100px] text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(hearing[field] ?? "");
            setEditing(false);
          }
        }}
        autoFocus
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full min-w-[80px] rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:bg-[var(--wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      onClick={() => {
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }}
    >
      {hearing[field] || (
        <span className="text-[var(--muted-soft)]">{placeholder}</span>
      )}
    </button>
  );
}

export default function DailyRegisterPage() {
  const { t } = useLocale();
  const { data: user } = useAuth();
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading } = useDailyRegister(date);
  const hearings = data?.data ?? [];

  const displayDate = useMemo(() => {
    try {
      return format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy");
    } catch {
      return date;
    }
  }, [date]);

  const isToday = date === format(new Date(), "yyyy-MM-dd");



  function handlePrint() {
    window.print();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <PageHeader
          title={t("daily_register.title")}
          description={t("daily_register.subtitle")}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          {t("daily_register.print")}
        </Button>
      </div>

      {/* Date navigation */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setDate(format(subDays(new Date(date + "T00:00:00"), 1), "yyyy-MM-dd"))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-soft)]" />
          <Input
            type="date"
            className="w-[180px] pl-9"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setDate(format(addDays(new Date(date + "T00:00:00"), 1), "yyyy-MM-dd"))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
          >
            {t("daily_register.today")}
          </Button>
        )}
      </div>

      {/* Print header — only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <div className="flex items-start justify-between border-b border-black pb-3">
          <div>
            <div className="text-lg font-bold">{user?.name ?? "—"}</div>
            <div className="text-xs text-gray-600">{t("daily_register.advocate")}</div>
            {user?.email && (
              <div className="text-xs text-gray-600">{user.email}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-base font-bold">{user?.tenant?.name ?? user?.tenant_name ?? "—"}</div>
            <div className="text-xs text-gray-600">casedex.app</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold">{t("daily_register.print_heading")}</div>
          <div className="text-sm">{displayDate}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : hearings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--muted)]">{t("daily_register.empty")}</p>
          <p className="mt-1 text-xs text-[var(--muted-soft)]">{displayDate}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--paper)] print:border-black print:rounded-none">
          <Table className="min-w-[800px] print:min-w-0">
            <TableHeader>
              <TableRow className="print:border-black">
                <TableHead className="w-[40px] text-center print:border print:border-black">
                  #
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.col_case_type")}
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.col_case_no")}
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.court")}
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.col_parties")}
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.col_time")}
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.col_outcome")}
                </TableHead>
                <TableHead className="print:border print:border-black">
                  {t("daily_register.col_next_date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hearings.map((h, idx) => (
                <TableRow key={h.public_id} className="print:border-black">
                  <TableCell className="text-center text-xs text-[var(--muted-soft)] print:border print:border-black">
                    {String(idx + 1).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs print:border print:border-black">
                    <span className="font-medium">
                      {h.registry_case_type_bn || h.type || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap print:border print:border-black">
                    {h.case_public_id ? (
                      <Link
                        href={`/cases/${h.case_public_id}`}
                        className="text-xs font-medium text-[var(--primary)] hover:underline print:text-black print:no-underline"
                      >
                        {h.case_number || h.case_title || "—"}
                      </Link>
                    ) : (
                      <span className="text-xs">{h.case_number || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs print:border print:border-black">
                    {h.court || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] text-xs print:border print:border-black">
                    <span className="line-clamp-2">{formatPartiesVs(h)}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-[var(--muted)] print:border print:border-black">
                    {h.hearing_at
                      ? format(new Date(h.hearing_at), "h:mm a")
                      : "—"}
                  </TableCell>
                  <TableCell className="print:border print:border-black">
                    <span className="print:hidden">
                      <InlineOutcome
                        hearing={h}
                        field="outcome"
                        placeholder={t("daily_register.outcome_placeholder")}
                      />
                    </span>
                    <span className="hidden text-xs print:inline">
                      {h.outcome || ""}
                    </span>
                  </TableCell>
                  <TableCell className="print:border print:border-black">
                    <span className="print:hidden">
                      <InlineOutcome
                        hearing={h}
                        field="next_steps"
                        placeholder={t("daily_register.next_date_placeholder")}
                      />
                    </span>
                    <span className="hidden text-xs print:inline">
                      {h.next_steps || ""}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary footer */}
      {hearings.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-[var(--muted)] print:mt-4">
          <span>
            {t("daily_register.total")}: {hearings.length}
          </span>
          <span>
            {t("daily_register.recorded")}:{" "}
            {hearings.filter((h) => h.outcome).length}
          </span>
          <span>
            {t("daily_register.pending")}:{" "}
            {hearings.filter((h) => !h.outcome).length}
          </span>
        </div>
      )}
    </section>
  );
}
