"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { useLocale } from "@/components/locale-provider";
import {
  useNotifications,
  useUpdateNotification,
} from "@/features/notifications/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
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
import { Bell, CheckCircle } from "lucide-react";

const statusOptions = ["all", "pending", "sent", "read"] as const;

export default function NotificationsPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useNotifications();
  const notifications = data?.data ?? [];
  const updateNotification = useUpdateNotification();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return notifications;
    return notifications.filter((n) => n.status === statusFilter);
  }, [notifications, statusFilter]);

  const markAsRead = (publicId: string) => {
    updateNotification.mutate({
      publicId,
      data: { title: notifications.find((n) => n.public_id === publicId)?.title ?? "" },
    });
  };

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
        title={t("notifications.subtitle")}
        description={t("notifications.description")}
      />

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? t("status.all") : t(`notifications.status.${opt}`) ?? opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="text-sm text-rose-600">{t("notifications.error")}</div>
      ) : filtered.length === 0 ? (
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
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("notifications.table.notification")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("notifications.table.status")}</TableHead>
                  <TableHead>{t("table.date") ?? "Date"}</TableHead>
                  <TableHead className="text-right">{t("common.actions") ?? "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((note) => (
                  <TableRow key={note.public_id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Bell className="mt-0.5 h-4 w-4 text-[var(--muted-soft)]" />
                        <div className="space-y-0.5">
                          <div className="font-medium text-[var(--foreground)]">
                            {note.title}
                          </div>
                          {note.body && (
                            <div className="text-xs text-[var(--muted-soft)]">
                              {note.body.slice(0, 80)}
                            </div>
                          )}
                          <div className="text-xs text-[var(--muted-soft)]">
                            {note.notification_type ?? "general"}
                          </div>
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
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={note.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--muted-soft)]">
                      {note.scheduled_for
                        ? format(new Date(note.scheduled_for), "PP")
                        : note.created_at
                          ? format(new Date(note.created_at), "PP")
                          : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {note.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(note.public_id)}
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          {t("notifications.mark_read") ?? "Mark read"}
                        </Button>
                      )}
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
