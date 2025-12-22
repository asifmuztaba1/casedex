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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Active", value: "active" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
];

export default function CasesPage() {
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
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Cases
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Case list</h1>
          <p className="text-sm text-slate-600">
            Review all matters and jump into the case workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">New case</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by case title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-[260px]"
            />
            <Input
              placeholder="Filter by court"
              value={courtFilter}
              onChange={(event) => setCourtFilter(event.target.value)}
              className="w-[220px]"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Status
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">Loading cases...</div>
          ) : isError ? (
            <div className="text-sm text-rose-600">
              Unable to load cases right now.
            </div>
          ) : filteredCases.length === 0 ? (
            <EmptyState
              title="No cases found"
              description="Create your first case to start tracking hearings, diary entries, and documents."
              action={
                <Button asChild>
                  <Link href="/cases/new">Create case</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.public_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">
                          {caseItem.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {caseItem.case_number ?? "Case number pending"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{caseItem.court ?? "Court TBD"}</TableCell>
                    <TableCell>
                      {caseItem.client?.name ?? "Client not set"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="subtle">
                        {caseItem.status ?? "open"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cases/${caseItem.public_id}`}>
                          Open
                        </Link>
                      </Button>
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
