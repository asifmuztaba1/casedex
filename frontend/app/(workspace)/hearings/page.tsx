"use client";

import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import { useHearings } from "@/features/hearings/use-hearings";
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

export default function HearingsPage() {
  const { data, isLoading, isError } = useHearings();
  const hearings = data?.data ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Hearings
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Hearing schedule
        </h1>
        <p className="text-sm text-slate-600">
          Upcoming hearings with direct links back to each case workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All hearings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">Loading hearings...</div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              Unable to load hearings right now.
            </div>
          ) : hearings.length === 0 ? (
            <EmptyState
              title="No hearings scheduled"
              description="Create a case and add the first hearing to start tracking the timeline."
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
                  <TableHead>Type</TableHead>
                  <TableHead>Next steps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hearings.map((hearing) => (
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
                            {hearing.case_title ?? "View case"}
                          </Link>
                        </Button>
                      ) : (
                        hearing.case_title ?? "Case"
                      )}
                    </TableCell>
                    <TableCell>{hearing.type ?? "Hearing"}</TableCell>
                    <TableCell>{hearing.next_steps ?? "-"}</TableCell>
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
