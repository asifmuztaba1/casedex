"use client";

import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { useHearings } from "@/features/hearings/use-hearings";
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

export default function HearingsPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useHearings();
  const hearings = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {t("hearings.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("hearings.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("hearings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("hearings.card_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">
              {t("hearings.loading")}
            </div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              {t("hearings.error")}
            </div>
          ) : hearings.length === 0 ? (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("hearing.next_steps")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hearings.map((hearing) => (
                  <TableRow key={hearing.public_id}>
                    <TableCell>
                      {hearing.hearing_at
                        ? format(new Date(hearing.hearing_at), "PPpp")
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
                        hearing.case_title ?? t("common.case")
                      )}
                    </TableCell>
                    <TableCell>
                      {hearing.type
                        ? t(`hearing.type.${hearing.type}`)
                        : t("hearing.type.hearing")}
                    </TableCell>
                    <TableCell>{hearing.next_steps ?? "-"}</TableCell>
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
