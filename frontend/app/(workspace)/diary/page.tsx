"use client";

import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { useDiaryEntries } from "@/features/diary/use-diary-entries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function DiaryPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useDiaryEntries();
  const entries = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {t("diary.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("diary.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("diary.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("diary.card_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">
              {t("common.loading")}
            </div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              {t("common.error_loading")}
            </div>
          ) : entries.length === 0 ? (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("common.entry")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.public_id}>
                    <TableCell>
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
                        entry.case_title ?? t("common.case")
                      )}
                    </TableCell>
                    <TableCell>{entry.title ?? t("common.entry")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
