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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Cases
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Case list</h1>
          <p className="text-sm text-slate-600">
            Review every matter and jump directly into the case workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">New case</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Refine by status, court, and name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Case title"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Court
              </label>
              <Input
                placeholder="Search by court"
                value={courtFilter}
                onChange={(event) => setCourtFilter(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {statusOptions.find((opt) => opt.value === statusFilter)
                      ?.label ?? "Status"}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>All cases</CardTitle>
            <CardDescription>
              Open a case to view hearings, diary entries, and documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <div className="grid gap-4">
                {filteredCases.map((caseItem) => (
                  <Card key={caseItem.public_id} className="border-slate-200">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {caseItem.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {caseItem.case_number ?? "Case number pending"} Â·{" "}
                          {caseItem.court ?? "Court TBD"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Client: {caseItem.client?.name ?? "Not set"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="subtle">
                          {caseItem.status ?? "open"}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/cases/${caseItem.public_id}`}>
                            Open
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
