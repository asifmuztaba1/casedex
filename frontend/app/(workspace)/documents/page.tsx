"use client";

import Link from "next/link";
import EmptyState from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { useDocuments } from "@/features/documents/use-documents";
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

export default function DocumentsPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useDocuments();
  const documents = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {t("documents.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("documents.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("documents.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.card_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">
              {t("documents.loading")}
            </div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              {t("documents.error")}
            </div>
          ) : documents.length === 0 ? (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.document")}</TableHead>
                  <TableHead>{t("table.case")}</TableHead>
                  <TableHead>{t("table.category")}</TableHead>
                  <TableHead>{t("document.download")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.public_id}>
                    <TableCell>{doc.original_name}</TableCell>
                    <TableCell>
                      {doc.case_public_id ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${doc.case_public_id}`}>
                            {doc.case_title ?? t("common.view_case")}
                          </Link>
                        </Button>
                      ) : (
                        doc.case_title ?? t("common.case")
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.category
                        ? t(`document.category.${doc.category}`)
                        : t("document.category.other")}
                    </TableCell>
                    <TableCell>
                      {doc.download_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.download_url}>
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
          )}
        </CardContent>
      </Card>
    </section>
  );
}
