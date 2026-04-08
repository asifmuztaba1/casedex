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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAiPayments,
  useApproveAiPayment,
  useRejectAiPayment,
} from "@/features/admin/use-admin-platform";
import { useLocale } from "@/components/locale-provider";
import { CheckCircle, XCircle, Image } from "lucide-react";

const STATUS_OPTIONS = ["", "pending", "approved", "rejected", "expired"];

export default function AdminAiPaymentsPage() {
  const { t } = useLocale();
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { data, isLoading } = useAdminAiPayments({
    status: status || undefined,
    search: search || undefined,
  });
  const payments = data?.data ?? [];
  const approve = useApproveAiPayment();
  const reject = useRejectAiPayment();

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    expired: "bg-[var(--wash)] text-[var(--muted)]",
  };

  const handleReject = () => {
    if (!rejectId) return;
    reject.mutate({ publicId: rejectId, reason: rejectReason || undefined });
    setRejectId(null);
    setRejectReason("");
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
          {t("admin.dashboard.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("admin.ai_payments.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">{t("admin.ai_payments.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="w-[260px]"
              placeholder={t("admin.ai_payments.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">{t("admin.ai_payments.all_statuses")}</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              {t("admin.ai_payments.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.ai_payments.col_tenant")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_user")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_pack")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_amount")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_txn")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_status")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_date")}</TableHead>
                    <TableHead>{t("admin.ai_payments.col_actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.public_id}>
                      <TableCell className="text-xs font-medium text-[var(--foreground)]">
                        {p.tenant_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{p.user_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {p.pack ? (
                          <span>{p.pack.name} ({p.pack.credits} cr)</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {p.currency} {p.amount}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{p.transaction_id ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[p.status ?? ""] ?? ""}>{p.status ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {p.screenshot_download_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title={t("admin.ai_payments.view_screenshot")}
                              onClick={() => window.open(p.screenshot_download_url ?? undefined, "_blank")}
                            >
                              <Image className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {p.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700"
                                onClick={() => approve.mutate({ publicId: p.public_id })}
                                disabled={approve.isPending}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700"
                                onClick={() => setRejectId(p.public_id)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {p.status === "rejected" && p.rejection_reason && (
                            <span className="text-[10px] text-rose-500" title={p.rejection_reason}>
                              {p.rejection_reason.slice(0, 30)}…
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.ai_payments.reject_title")}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={t("admin.ai_payments.reject_placeholder")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }}>
              {t("admin.ai_payments.cancel")}
            </Button>
            <Button variant="default" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleReject} disabled={reject.isPending}>
              {t("admin.ai_payments.reject_confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
