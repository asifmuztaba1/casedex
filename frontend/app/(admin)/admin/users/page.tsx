"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUsers, useUpdateUserRole } from "@/features/admin/use-admin-platform";
import { useLocale } from "@/components/locale-provider";
import { ChevronDown, Check, Shield } from "lucide-react";

const ALL_ROLES = [
  "platform_admin",
  "platform_editor",
  "admin",
  "lawyer",
  "associate",
  "assistant",
  "viewer",
];

const ROLE_FILTER = ["", ...ALL_ROLES];

export default function AdminUsersPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
  });
  const users = data?.data ?? [];
  const updateRole = useUpdateUserRole();

  const roleColors: Record<string, string> = {
    platform_admin: "bg-rose-100 text-rose-800",
    platform_editor: "bg-orange-100 text-orange-800",
    admin: "bg-indigo-100 text-indigo-800",
    lawyer: "bg-teal-100 text-teal-800",
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
          {t("admin.dashboard.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("admin.users.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">{t("admin.users.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="w-[260px]"
              placeholder={t("admin.users.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">{t("admin.users.all_roles")}</option>
              {ROLE_FILTER.filter(Boolean).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              {t("admin.users.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.col_name")}</TableHead>
                    <TableHead>{t("admin.users.col_email")}</TableHead>
                    <TableHead>{t("admin.users.col_role")}</TableHead>
                    <TableHead>{t("admin.users.col_firm")}</TableHead>
                    <TableHead>{t("admin.users.col_verified")}</TableHead>
                    <TableHead>{t("admin.users.col_created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.public_id}>
                      <TableCell className="font-medium text-[var(--foreground)]">
                        {user.name}
                        {user.whatsapp_opted_in && (
                          <span className="ml-1 text-emerald-600" title="WhatsApp enabled">WA</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{user.email}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 px-2">
                              <Badge className={roleColors[user.role] ?? ""}>
                                {user.role.includes("platform") && <Shield className="mr-1 h-3 w-3" />}
                                {user.role}
                              </Badge>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {ALL_ROLES.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => {
                                  if (role !== user.role) {
                                    updateRole.mutate({ publicId: user.public_id, role });
                                  }
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  {role === user.role && <Check className="h-3 w-3" />}
                                  {role}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-xs">{user.tenant_name ?? "—"}</TableCell>
                      <TableCell>
                        {user.email_verified_at ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
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
