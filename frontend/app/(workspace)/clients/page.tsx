"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { useClients } from "@/features/clients/use-clients";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const typeOptions = ["all", "person", "organization"] as const;

export default function ClientsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading, isError } = useClients({
    is_client: "1",
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const clients = data?.data ?? [];

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("clients.title") ?? "Clients"}
        description={t("clients.subtitle") ?? "Your firm's client directory"}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-soft)]" />
          <Input
            className="w-[260px] pl-9"
            placeholder={t("clients.search_placeholder") ?? "Search clients..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all"
                  ? (t("status.all") ?? "All")
                  : (t(`contact.type.${opt}`) ?? opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="text-sm text-rose-600">
          {t("clients.error") ?? "Failed to load clients."}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title={t("clients.empty_title") ?? "No clients yet"}
          description={t("clients.empty_desc") ?? "Add a client to get started."}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name") ?? "Name"}</TableHead>
                  <TableHead>{t("table.type") ?? "Type"}</TableHead>
                  <TableHead>{t("table.phone") ?? "Phone"}</TableHead>
                  <TableHead>{t("table.email") ?? "Email"}</TableHead>
                  <TableHead>{t("table.cases") ?? "Cases"}</TableHead>
                  <TableHead>{t("table.actions") ?? "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.name}
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {t(`contact.type.${client.type}`) ?? client.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.phone ?? "-"}</TableCell>
                    <TableCell>{client.email ?? "-"}</TableCell>
                    <TableCell>{client.case_parties_count}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>
                          {t("common.view") ?? "View"}
                        </Link>
                      </Button>
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
