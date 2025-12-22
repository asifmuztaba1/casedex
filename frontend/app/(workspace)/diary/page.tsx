"use client";

import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import { useDiaryEntries } from "@/features/diary/use-diary-entries";
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

export default function DiaryPage() {
  const { data, isLoading, isError } = useDiaryEntries();
  const entries = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Diary</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Case diary entries
        </h1>
        <p className="text-sm text-slate-600">
          Every diary entry is tied to a case for traceability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent diary entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">Loading diary entries...</div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              Unable to load diary entries right now.
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title="No diary entries yet"
              description="Create a case and add the first diary entry to track updates."
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
                  <TableHead>Date</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Entry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.public_id}>
                    <TableCell>
                      {entry.entry_at
                        ? format(new Date(entry.entry_at), "PP")
                        : "TBD"}
                    </TableCell>
                    <TableCell>
                      {entry.case_public_id ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${entry.case_public_id}`}>
                            {entry.case_title ?? "View case"}
                          </Link>
                        </Button>
                      ) : (
                        entry.case_title ?? "Case"
                      )}
                    </TableCell>
                    <TableCell>{entry.title ?? "Entry"}</TableCell>
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
