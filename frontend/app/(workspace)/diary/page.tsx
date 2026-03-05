"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { useDiaryEntries } from "@/features/diary/use-diary-entries";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search } from "lucide-react";

export default function DiaryPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useDiaryEntries();
  const entries = data?.data ?? [];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        (e.title ?? "").toLowerCase().includes(q) ||
        (e.case_title ?? "").toLowerCase().includes(q) ||
        (e.body ?? "").toLowerCase().includes(q)
    );
  }, [entries, search]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("diary.title")}
        description={t("diary.subtitle")}
      />

      <div className="relative w-fit">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          className="w-[260px] pl-9"
          placeholder={t("diary.search_placeholder") ?? "Search diary entries..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError ? (
        <div className="text-sm text-rose-600">{t("common.error_loading")}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("diary.empty_title")}
          description={t("diary.empty_desc")}
          action={
            <Button asChild>
              <Link href="/cases">{t("common.go_to_cases")}</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("common.entry")}</TableHead>
                  <TableHead>{t("diary.body") ?? "Notes"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.public_id}>
                    <TableCell className="whitespace-nowrap">
                      {entry.entry_at
                        ? format(new Date(entry.entry_at), "PP")
                        : t("common.tbd")}
                    </TableCell>
                    <TableCell>
                      {entry.case_public_id ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${entry.case_public_id}`}>
                            {entry.case_title ?? t("common.view_case")}
                          </Link>
                        </Button>
                      ) : (
                        entry.case_title ?? "-"
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {entry.title ?? t("common.entry")}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-slate-500">
                      {entry.body ? entry.body.slice(0, 120) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
