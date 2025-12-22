"use client";

import Link from "next/link";
import EmptyState from "@/components/empty-state";
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
  const { data, isLoading, isError } = useDocuments();
  const documents = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Documents
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Case documents
        </h1>
        <p className="text-sm text-slate-600">
          Document uploads remain connected to the case they belong to.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">Loading documents...</div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              Unable to load documents right now.
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload documents within a case to keep files organized."
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
                  <TableHead>Document</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Download</TableHead>
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
                            {doc.case_title ?? "View case"}
                          </Link>
                        </Button>
                      ) : (
                        doc.case_title ?? "Case"
                      )}
                    </TableCell>
                    <TableCell>{doc.category ?? "Other"}</TableCell>
                    <TableCell>
                      {doc.download_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.download_url}>Download</a>
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
