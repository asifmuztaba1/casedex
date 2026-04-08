"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminTenants } from "@/features/admin/use-admin-platform";
import { useLocale } from "@/components/locale-provider";

const PLAN_OPTIONS = ["", "trial", "starter", "professional", "chambers"];

export default function AdminTenantsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const { data, isLoading } = useAdminTenants({
    search: search || undefined,
    plan: plan || undefined,
  });
  const tenants = data?.data ?? [];

  const planColors: Record<string, string> = {
    trial: "bg-amber-100 text-amber-800",
    starter: "bg-[var(--wash)] text-[var(--muted)]",
    professional: "bg-indigo-100 text-indigo-800",
    chambers: "bg-teal-100 text-teal-800",
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
          {t("admin.dashboard.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("admin.tenants.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">{t("admin.tenants.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="w-[260px]"
              placeholder={t("admin.tenants.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="">{t("admin.tenants.all_plans")}</option>
              {PLAN_OPTIONS.filter(Boolean).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : tenants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              {t("admin.tenants.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.tenants.col_name")}</TableHead>
                    <TableHead>{t("admin.tenants.col_plan")}</TableHead>
                    <TableHead>{t("admin.tenants.col_users")}</TableHead>
                    <TableHead>{t("admin.tenants.col_country")}</TableHead>
                    <TableHead>{t("admin.tenants.col_trial_ends")}</TableHead>
                    <TableHead>{t("admin.tenants.col_created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.public_id}>
                      <TableCell className="font-medium text-[var(--foreground)]">
                        {tenant.name}
                        <div className="text-[10px] text-[var(--muted-soft)]">{tenant.public_id.slice(0, 12)}...</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[tenant.plan ?? ""] ?? ""}>{tenant.plan ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>{tenant.users_count}</TableCell>
                      <TableCell>{tenant.country ?? "—"}</TableCell>
                      <TableCell>
                        {tenant.trial_ends_at
                          ? new Date(tenant.trial_ends_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
