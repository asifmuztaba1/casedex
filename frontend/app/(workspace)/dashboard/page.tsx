"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { useCases } from "@/features/cases/use-cases";
import { useHearings } from "@/features/hearings/use-hearings";
import { useDiaryEntries } from "@/features/diary/use-diary-entries";
import { useDocuments } from "@/features/documents/use-documents";
import { useNotifications } from "@/features/notifications/use-notifications";
import { useLocale } from "@/components/locale-provider";
import { useAuth } from "@/features/auth/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useAuth();
  const { data: casesData, isLoading: casesLoading } = useCases();
  const { data: hearingsData, isLoading: hearingsLoading } = useHearings();
  const { data: diaryData } = useDiaryEntries();
  const { data: documentsData } = useDocuments();
  const { data: notificationsData } = useNotifications();

  const cases = casesData?.data ?? [];
  const hearings = hearingsData?.data ?? [];
  const diaryEntries = diaryData?.data ?? [];
  const documents = documentsData?.data ?? [];
  const notifications = notificationsData?.data ?? [];

  const upcomingHearings = useMemo(
    () => hearings.filter((hearing) => Boolean(hearing.hearing_at)).slice(0, 5),
    [hearings]
  );

  const recentDiaryEntries = useMemo(() => diaryEntries.slice(0, 3), [
    diaryEntries,
  ]);

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);

  useEffect(() => {
    if (searchParams.get("billing") !== "success") {
      return;
    }

    toast({
      title: "Subscription active",
      description: "Payment completed successfully. Your workspace is now active.",
      variant: "success",
    });

    router.replace("/dashboard");
  }, [router, searchParams, toast]);

  if (casesLoading || hearingsLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("dashboard.welcome")}{user ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("dashboard.welcome_desc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/cases/new">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("dashboard.new_case")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("dashboard.metrics.cases"), value: `${cases.length}` },
          {
            label: t("dashboard.metrics.hearings"),
            value: `${upcomingHearings.length}`,
          },
          { label: t("dashboard.metrics.diary"), value: `${diaryEntries.length}` },
          {
            label: t("dashboard.metrics.notifications"),
            value: `${notifications.length}`,
          },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              <CardTitle className="text-3xl font-semibold">
                {metric.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>{t("dashboard.section.hearings")}</CardTitle>
            <CardDescription>
              {t("dashboard.section.hearings_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    {t("dashboard.table.date")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("dashboard.table.case")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("dashboard.table.type")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("dashboard.table.next_step")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingHearings.map((hearing) => (
                  <TableRow key={hearing.public_id}>
                    <TableCell>
                      {hearing.hearing_at
                        ? format(new Date(hearing.hearing_at), "PPpp")
                        : "TBD"}
                    </TableCell>
                    <TableCell>
                      {hearing.case_public_id ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${hearing.case_public_id}`}>
                            {hearing.case_title ?? t("dashboard.table.case")}
                          </Link>
                        </Button>
                      ) : (
                        hearing.case_title ?? t("dashboard.table.case")
                      )}
                    </TableCell>
                    <TableCell>{hearing.type ?? t("nav.hearings")}</TableCell>
                    <TableCell>{hearing.next_steps ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.section.actions")}</CardTitle>
              <CardDescription>
                {t("dashboard.section.actions_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(upcomingHearings.length
                ? upcomingHearings.map((hearing) => ({
                    label: `${hearing.case_title ?? t("dashboard.table.case")}: ${hearing.next_steps ?? t("dashboard.section.hearings_desc")}`,
                  }))
                : [{ label: t("dashboard.action_default") }]
              ).map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  {item.label}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.section.diary")}</CardTitle>
              <CardDescription>{t("dashboard.section.diary_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDiaryEntries.length === 0 ? (
                <div className="text-sm text-slate-600">
                  {t("dashboard.diary_empty")}
                </div>
              ) : (
                recentDiaryEntries.map((entry) => (
                  <div key={entry.public_id} className="space-y-1">
                    <div className="text-sm font-medium text-slate-900">
                      {entry.title ?? t("case.detail.tabs.diary")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {entry.entry_at
                        ? format(new Date(entry.entry_at), "PP")
                        : ""}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t("dashboard.section.documents")}</CardTitle>
              <CardDescription>
                {t("dashboard.section.documents_desc")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="w-[220px] pl-9"
                  placeholder={t("dashboard.search_documents")}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t("dashboard.filter_type")}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>{t("dashboard.filter_all")}</DropdownMenuItem>
                  <DropdownMenuItem>{t("dashboard.filter_orders")}</DropdownMenuItem>
                  <DropdownMenuItem>{t("dashboard.filter_transcripts")}</DropdownMenuItem>
                  <DropdownMenuItem>{t("dashboard.filter_exhibits")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  {t("dashboard.table.document")}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {t("dashboard.table.case")}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {t("dashboard.table.type")}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {t("dashboard.table.updated")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.map((doc) => (
                <TableRow key={doc.public_id}>
                  <TableCell>{doc.original_name ?? t("dashboard.table.document")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/cases/${doc.case_public_id ?? ""}`}>
                        {doc.case_title ?? t("dashboard.table.case")}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>{doc.category ?? t("case.detail.tabs.documents")}</TableCell>
                  <TableCell>
                    {doc.created_at
                      ? format(new Date(doc.created_at), "PP")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
