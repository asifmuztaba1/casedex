"use client";

import Link from "next/link";
import EmptyState from "@/components/empty-state";
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
  const { data, isLoading, isError } = useNotifications();
  const notifications = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Notifications
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Alerts and reminders
        </h1>
        <p className="text-sm text-slate-600">
          Hearing reminders are sent one day before each hearing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">Loading notifications...</div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              Unable to load notifications right now.
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              description="Notifications will appear after hearings are scheduled."
              action={
                <Button asChild>
                  <Link href="/cases">Go to cases</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Status</TableHead>
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
                            {note.case_title ?? "View case"}
                          </Link>
                        </Button>
                      ) : (
                        note.case_title ?? "Case"
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
