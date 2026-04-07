"use client";

import { useState } from "react";
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
const clientFilterOptions = ["all", "clients", "non-clients"] as const;

export default function ContactsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  const { data, isLoading, isError } = useClients({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    is_client:
      clientFilter === "clients"
        ? "1"
        : clientFilter === "non-clients"
          ? "0"
          : undefined,
  });

  const contacts = data?.data ?? [];

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
        title={t("contacts.title") ?? "Contacts"}
        description={t("contacts.subtitle") ?? "All contacts and parties across your cases"}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="w-[260px] pl-9"
            placeholder={t("contacts.search_placeholder") ?? "Search contacts..."}
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
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clientFilterOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all"
                  ? (t("status.all") ?? "All")
                  : opt === "clients"
                    ? (t("contacts.filter_clients") ?? "Clients")
                    : (t("contacts.filter_non_clients") ?? "Non-clients")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="text-sm text-rose-600">
          {t("contacts.error") ?? "Failed to load contacts."}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          title={t("contacts.empty_title") ?? "No contacts yet"}
          description={t("contacts.empty_desc") ?? "Contacts will appear here as you add parties to cases."}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name") ?? "Name"}</TableHead>
                  <TableHead>{t("table.type") ?? "Type"}</TableHead>
                  <TableHead>{t("contact.client") ?? "Client?"}</TableHead>
                  <TableHead>{t("table.phone") ?? "Phone"}</TableHead>
                  <TableHead>{t("table.email") ?? "Email"}</TableHead>
                  <TableHead>{t("table.cases") ?? "Cases"}</TableHead>
                  <TableHead>{t("table.actions") ?? "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name}
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {t(`contact.type.${contact.type}`) ?? contact.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.is_client ? (
                        <Badge variant="subtle">
                          {t("common.yes") ?? "Yes"}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {t("common.no") ?? "No"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{contact.phone ?? "-"}</TableCell>
                    <TableCell>{contact.email ?? "-"}</TableCell>
                    <TableCell>{contact.case_parties_count}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contacts/${contact.id}`}>
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
