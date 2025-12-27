"use client";

import Link from "next/link";
import EmptyState from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { useNotifications } from "@/features/notifications/use-notifications";
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

export default function NotificationsPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useNotifications();
  const notifications = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {t("notifications.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("notifications.subtitle")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("notifications.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.card_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">
              {t("notifications.loading")}
            </div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              {t("notifications.error")}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              title={t("notifications.empty_title")}
              description={t("notifications.empty_desc")}
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
                  <TableHead>{t("notifications.table.notification")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("notifications.table.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((note) => (
                  <TableRow key={note.public_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">
                          {note.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {note.notification_type ?? "general"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {note.case_public_id ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${note.case_public_id}`}>
                            {note.case_title ?? t("common.view_case")}
                          </Link>
                        </Button>
                      ) : (
                        note.case_title ?? t("common.case")
                      )}
                    </TableCell>
                    <TableCell>{note.status}</TableCell>
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
