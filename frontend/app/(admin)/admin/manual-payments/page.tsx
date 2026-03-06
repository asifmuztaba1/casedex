"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminManualMethods,
  useAdminManualPayments,
  useApproveManualPayment,
  useCreateManualMethod,
  useDeleteManualMethod,
  useRejectManualPayment,
  useUpdateManualMethod,
} from "@/features/admin/billing/use-admin-manual-payments";
import { useLocale } from "@/components/locale-provider";
import { useToast } from "@/components/ui/use-toast";

export default function AdminManualPaymentsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [status, setStatus] = useState<"" | "pending" | "approved" | "rejected" | "expired">("pending");
  const [tenant, setTenant] = useState("");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [newMethod, setNewMethod] = useState({
    channel: "bkash" as "bkash" | "rocket",
    account_name: "",
    receiver_number: "",
    instructions_en: "",
    instructions_bn: "",
  });

  const { data: payments = [] } = useAdminManualPayments({ status, tenant: tenant || undefined });
  const { data: methods = [] } = useAdminManualMethods();
  const approve = useApproveManualPayment();
  const reject = useRejectManualPayment();
  const createMethod = useCreateManualMethod();
  const updateMethod = useUpdateManualMethod();
  const deleteMethod = useDeleteManualMethod();

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => (a.created_at && b.created_at ? Date.parse(b.created_at) - Date.parse(a.created_at) : 0)),
    [payments]
  );

  const openScreenshot = async (url: string) => {
    try {
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Screenshot request failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      toast({
        title: "Unable to open screenshot",
        description: error instanceof Error ? error.message : "Request failed.",
        variant: "error",
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("admin.title")}</p>
        <h1 className="text-2xl font-semibold text-slate-900">Manual MFS payments</h1>
        <p className="text-sm text-slate-600">Review bKash/Rocket requests and maintain receiver numbers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review requests</CardTitle>
          <CardDescription>Approve/reject pending requests. Approval starts from payment sent time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "" | "pending" | "approved" | "rejected" | "expired")}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <Input placeholder="Filter by tenant name/public id" value={tenant} onChange={(event) => setTenant(event.target.value)} />
          </div>

          <div className="space-y-3">
            {sortedPayments.length === 0 && (
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">No manual requests found.</div>
            )}
            {sortedPayments.map((item) => (
              <div key={item.public_id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.tenant_name ?? "Tenant"}</div>
                    <div className="text-xs text-slate-600">{item.user_name} • {item.plan} • {item.interval}</div>
                    <div className="text-xs text-slate-600">
                      {item.amount} {item.currency} • TXN: {item.transaction_id}
                    </div>
                    <div className="text-xs text-slate-600">Sent at: {new Date(item.sent_at).toLocaleString()}</div>
                    {item.temporary_access_expires_at && (
                      <div className="text-xs text-amber-700">Temporary access until: {new Date(item.temporary_access_expires_at).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{item.status}</Badge>
                    {item.screenshot_download_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScreenshot(item.screenshot_download_url as string)}
                      >
                        Screenshot
                      </Button>
                    )}
                  </div>
                </div>

                {item.status === "pending" && (
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <Textarea
                      placeholder="Optional rejection reason"
                      value={rejectReason[item.public_id] ?? ""}
                      onChange={(event) =>
                        setRejectReason((prev) => ({ ...prev, [item.public_id]: event.target.value }))
                      }
                    />
                    <Button
                      onClick={() => approve.mutate(item.public_id)}
                      disabled={approve.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        reject.mutate({
                          publicId: item.public_id,
                          reason: rejectReason[item.public_id] || undefined,
                        })
                      }
                      disabled={reject.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {item.status === "rejected" && item.rejection_reason && (
                  <p className="mt-2 text-xs text-rose-700">Reason: {item.rejection_reason}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receiver methods</CardTitle>
          <CardDescription>Manage platform bKash/Rocket numbers and instructions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={newMethod.channel}
              onChange={(event) =>
                setNewMethod((prev) => ({ ...prev, channel: event.target.value as "bkash" | "rocket" }))
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="bkash">bKash</option>
              <option value="rocket">Rocket</option>
            </select>
            <Input
              placeholder="Receiver number"
              value={newMethod.receiver_number}
              onChange={(event) => setNewMethod((prev) => ({ ...prev, receiver_number: event.target.value }))}
            />
            <Input
              placeholder="Account name"
              value={newMethod.account_name}
              onChange={(event) => setNewMethod((prev) => ({ ...prev, account_name: event.target.value }))}
            />
            <Input
              placeholder="Instructions (EN)"
              value={newMethod.instructions_en}
              onChange={(event) => setNewMethod((prev) => ({ ...prev, instructions_en: event.target.value }))}
            />
            <Input
              placeholder="Instructions (BN)"
              value={newMethod.instructions_bn}
              onChange={(event) => setNewMethod((prev) => ({ ...prev, instructions_bn: event.target.value }))}
            />
          </div>
          <Button
            onClick={() =>
              createMethod.mutate({
                ...newMethod,
                sort_order: methods.length,
                active: true,
              })
            }
            disabled={createMethod.isPending || !newMethod.receiver_number}
          >
            Add method
          </Button>

          <div className="space-y-3">
            {methods.map((method) => (
              <div key={method.public_id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {method.channel.toUpperCase()} • {method.receiver_number}
                    </div>
                    <div className="text-xs text-slate-600">{method.account_name ?? "-"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateMethod.mutate({
                          public_id: method.public_id,
                          active: !method.active,
                        })
                      }
                      disabled={updateMethod.isPending}
                    >
                      {method.active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMethod.mutate(method.public_id)}
                      disabled={deleteMethod.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
