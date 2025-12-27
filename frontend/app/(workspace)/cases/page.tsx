"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/empty-state";
import { useCases } from "@/features/cases/use-cases";
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
import { ChevronDown, Search } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

const statusOptions = [
  { labelKey: "status.all", value: "all" },
  { labelKey: "status.open", value: "open" },
  { labelKey: "status.active", value: "active" },
  { labelKey: "status.closed", value: "closed" },
  { labelKey: "status.archived", value: "archived" },
];

export default function CasesPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useCases();
  const cases = data?.data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("");

  const filteredCases = useMemo(() => {
    return cases.filter((caseItem) => {
      const matchesSearch = caseItem.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || caseItem.status === statusFilter;
      const matchesCourt = caseItem.court
        ? caseItem.court.toLowerCase().includes(courtFilter.toLowerCase())
        : courtFilter.length === 0;

      return matchesSearch && matchesStatus && matchesCourt;
    });
  }, [cases, search, statusFilter, courtFilter]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("cases.list.kicker")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("cases.list.title")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("cases.list.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">{t("nav.new_case")}</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">{t("cases.list.filters")}</CardTitle>
            <CardDescription>{t("cases.list.filters_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("cases.list.search")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t("cases.list.search_placeholder")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("cases.list.court")}
              </label>
              <Input
                placeholder={t("cases.list.court_placeholder")}
                value={courtFilter}
                onChange={(event) => setCourtFilter(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("cases.list.status")}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {t(
                      statusOptions.find((opt) => opt.value === statusFilter)
                        ?.labelKey ?? "cases.list.status"
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                    >
                      {t(option.labelKey)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>{t("cases.list.all_cases")}</CardTitle>
            <CardDescription>
              {t("cases.list.open_case_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-slate-600">
                {t("cases.list.loading")}
              </div>
            ) : isError ? (
              <div className="text-sm text-rose-600">
                {t("cases.list.error")}
              </div>
            ) : filteredCases.length === 0 ? (
              <EmptyState
                title={t("cases.list.empty_title")}
                description={t("cases.list.empty_desc")}
                action={
                  <Button asChild>
                    <Link href="/cases/new">{t("cases.list.empty_action")}</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {filteredCases.map((caseItem) => (
                  <Card key={caseItem.public_id} className="border-slate-200">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {caseItem.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {caseItem.case_number ?? t("cases.list.case_number_pending")} -{" "}
                          {caseItem.court ?? t("cases.list.court_pending")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {t("cases.list.client_label")}:{" "}
                          {caseItem.client?.name ?? t("cases.list.client_empty")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="subtle">
                          {t(`status.${caseItem.status ?? "open"}`)}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/cases/${caseItem.public_id}`}>
                            {t("cases.list.open")}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
