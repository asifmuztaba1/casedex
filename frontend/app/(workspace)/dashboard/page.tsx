"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
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
import { useSubscription } from "@/features/billing/use-billing";

function formatLocalizedDate(
  locale: "en" | "bn",
  date: Date,
  withTime = false
) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useAuth();
  const { data: subscription, refetch: refetchSubscription } = useSubscription();
  const { data: casesData, isLoading: casesLoading } = useCases();
  const { data: hearingsData, isLoading: hearingsLoading } = useHearings();
  const { data: diaryData } = useDiaryEntries();
  const { data: documentsData } = useDocuments();
  const { data: notificationsData } = useNotifications();

  const cases = useMemo(() => casesData?.data ?? [], [casesData?.data]);
  const hearings = useMemo(() => hearingsData?.data ?? [], [hearingsData?.data]);
  const diaryEntries = useMemo(() => diaryData?.data ?? [], [diaryData?.data]);
  const documents = useMemo(() => documentsData?.data ?? [], [documentsData?.data]);
  const notifications = useMemo(
    () => notificationsData?.data ?? [],
    [notificationsData?.data]
  );

  const upcomingHearings = useMemo(
    () =>
      hearings
        .filter((hearing) => Boolean(hearing.hearing_at))
        .sort((left, right) => {
          const leftValue = left.hearing_at
            ? new Date(left.hearing_at).getTime()
            : Number.MAX_SAFE_INTEGER;
          const rightValue = right.hearing_at
            ? new Date(right.hearing_at).getTime()
            : Number.MAX_SAFE_INTEGER;
          return leftValue - rightValue;
        })
        .slice(0, 5),
    [hearings]
  );

  const recentDiaryEntries = useMemo(() => diaryEntries.slice(0, 3), [
    diaryEntries,
  ]);

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);

  const deadlineItems = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    const weekAheadTime = nowTime + 7 * 24 * 60 * 60 * 1000;
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      badge: string;
      href: string;
      hrefLabel: string;
    }> = [];

    const resolveBadge = (date: Date, fallback: string) => {
      const diff = date.getTime() - nowTime;
      if (diff <= 24 * 60 * 60 * 1000) {
        return t("dashboard.deadlines.badge.today");
      }
      if (diff <= 48 * 60 * 60 * 1000) {
        return t("dashboard.deadlines.badge.soon");
      }
      return fallback;
    };

    if (subscription?.on_trial && subscription.trial_ends_at) {
      const trialEndsAt = new Date(subscription.trial_ends_at);
      const trialEndsTime = trialEndsAt.getTime();
      if (!Number.isNaN(trialEndsTime) && trialEndsTime <= weekAheadTime) {
        items.push({
          id: "trial-access",
          title: t("dashboard.deadlines.trial_title"),
          detail: `${t("dashboard.deadlines.trial_desc")} ${formatLocalizedDate(
            locale,
            trialEndsAt
          )}`,
          badge: resolveBadge(
            trialEndsAt,
            t("dashboard.deadlines.badge.billing")
          ),
          href: "/settings/billing",
          hrefLabel: t("nav.billing"),
        });
      }
    }

    if (
      subscription?.manual_status === "pending" &&
      subscription.temporary_access_expires_at
    ) {
      const reviewEndsAt = new Date(subscription.temporary_access_expires_at);
      const reviewEndsTime = reviewEndsAt.getTime();
      if (!Number.isNaN(reviewEndsTime) && reviewEndsTime <= weekAheadTime) {
        items.push({
          id: "billing-review",
          title: t("dashboard.deadlines.review_title"),
          detail: `${t("dashboard.deadlines.review_desc")} ${formatLocalizedDate(
            locale,
            reviewEndsAt,
            true
          )}`,
          badge: resolveBadge(
            reviewEndsAt,
            t("dashboard.deadlines.badge.billing")
          ),
          href: "/settings/billing",
          hrefLabel: t("nav.billing"),
        });
      }
    }

    upcomingHearings.forEach((hearing) => {
      if (!hearing.hearing_at) {
        return;
      }
      const hearingDate = new Date(hearing.hearing_at);
      const hearingTime = hearingDate.getTime();
      if (
        Number.isNaN(hearingTime) ||
        hearingTime < nowTime ||
        hearingTime > weekAheadTime
      ) {
        return;
      }

      items.push({
        id: hearing.public_id,
        title: hearing.case_title ?? t("dashboard.deadlines.hearing_title"),
        detail: `${hearing.type ? t(`hearing.type.${hearing.type}`) : t("hearing.type.hearing")} · ${formatLocalizedDate(
          locale,
          hearingDate,
          true
        )}`,
        badge: resolveBadge(hearingDate, t("dashboard.deadlines.badge.week")),
        href: hearing.case_public_id
          ? `/cases/${hearing.case_public_id}`
          : "/hearings",
        hrefLabel: hearing.case_public_id ? t("common.view_case") : t("nav.hearings"),
      });
    });

    return items.slice(0, 4);
  }, [locale, subscription, t, upcomingHearings]);

  useEffect(() => {
    if (searchParams.get("billing") !== "success") {
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const checkAndSync = async () => {
      attempts += 1;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
        refetchSubscription(),
      ]);

      if (cancelled) {
        return;
      }

      const refreshedUser = queryClient.getQueryData<{
        tenant?: { has_active_subscription?: boolean; has_workspace_access?: boolean } | null;
      }>(["auth-me"]);
      const hasAccess =
        (refreshedUser?.tenant?.has_workspace_access ??
          refreshedUser?.tenant?.has_active_subscription ??
          false) === true;

      if (hasAccess) {
        toast({
          title: "Subscription active",
          description: "Payment completed successfully. Your workspace is now active.",
          variant: "success",
        });
        router.replace("/dashboard");
        return;
      }

      if (attempts >= maxAttempts) {
        toast({
          title: "Payment processing",
          description: "Your payment was received. Subscription sync is still pending.",
          variant: "error",
        });
        router.replace("/settings/billing?onboarding=1");
        return;
      }

      setTimeout(checkAndSync, 2000);
    };

    void checkAndSync();

    return () => {
      cancelled = true;
    };
  }, [queryClient, refetchSubscription, router, searchParams, toast]);

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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            {t("dashboard.welcome")}{user ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-soft)]">{t("dashboard.welcome_desc")}</p>
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
              <p className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">
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
          <CardContent className="overflow-x-auto">
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
              <CardTitle>{t("dashboard.deadlines.title")}</CardTitle>
              <CardDescription>{t("dashboard.deadlines.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deadlineItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-4 py-3 text-sm text-[var(--muted)]">
                  {t("dashboard.deadlines.empty")}
                </div>
              ) : (
                deadlineItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--wash)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-[var(--foreground)]">
                          {item.title}
                        </div>
                        <div className="text-xs text-[var(--muted-soft)]">{item.detail}</div>
                      </div>
                      <Badge variant="subtle" className="shrink-0">
                        {item.badge}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="mt-2 px-0 text-[var(--accent)] hover:bg-transparent"
                    >
                      <Link href={item.href}>{item.hrefLabel}</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

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
                  className="rounded-2xl border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--muted)]"
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
                <div className="text-sm text-[var(--muted)]">
                  {t("dashboard.diary_empty")}
                </div>
              ) : (
                recentDiaryEntries.map((entry) => (
                  <div key={entry.public_id} className="space-y-1">
                    <div className="text-sm font-medium text-[var(--foreground)]">
                      {entry.title ?? t("case.detail.tabs.diary")}
                    </div>
                    <div className="text-xs text-[var(--muted-soft)]">
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
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-soft)]" />
                <Input
                  className="w-full pl-9 sm:w-[220px]"
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
        <CardContent className="overflow-x-auto">
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
