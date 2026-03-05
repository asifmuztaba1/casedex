"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import { useLocale } from "@/components/locale-provider";
import { useDocuments } from "@/features/documents/use-documents";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Search } from "lucide-react";

const categoryOptions = [
  "all",
  "petition",
  "evidence",
  "order_sheet",
  "client_id",
  "notes",
  "other",
] as const;

export default function DocumentsPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useDocuments();
  const documents = data?.data ?? [];
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        (doc.original_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (doc.case_title ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, search, categoryFilter]);

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
        title={t("documents.title")}
        description={t("documents.subtitle")}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="w-[260px] pl-9"
            placeholder={t("documents.search_placeholder") ?? "Search documents..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all"
                  ? t("status.all")
                  : t(`document.category.${opt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="text-sm text-rose-600">{t("documents.error")}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("documents.empty_title")}
          description={t("documents.empty_desc")}
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
                  <TableHead>{t("table.document")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("table.category")}</TableHead>
                  <TableHead>{t("table.date") ?? "Date"}</TableHead>
                  <TableHead className="text-right">{t("document.download")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.public_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {doc.original_name ?? "Untitled"}
                        </span>
                        {doc.size && (
                          <span className="text-xs text-slate-400">
                            ({(doc.size / 1024).toFixed(0)} KB)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.case_public_id ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${doc.case_public_id}`}>
                            {doc.case_title ?? t("common.view_case")}
                          </Link>
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={doc.category ?? "other"}
                        label={
                          doc.category
                            ? t(`document.category.${doc.category}`)
                            : t("document.category.other")
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {doc.created_at
                        ? format(new Date(doc.created_at), "PP")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.download_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.download_url} download>
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            {t("document.download")}
                          </a>
                        </Button>
                      ) : (
                        "-"
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
