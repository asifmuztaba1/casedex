"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale } from "@/components/locale-provider";
import { formatDate } from "@/lib/date-format";
import {
  type InviteCode,
  useCreateInviteCode,
  useInviteCodes,
  useRevokeInviteCode,
  useSetRegistrationMode,
} from "@/features/admin/use-invite-codes";

function CopyLinkButton({ invite }: { invite: InviteCode }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`${t("admin.invites.copy_link")}: ${invite.code}`}
      onClick={() => {
        void navigator.clipboard.writeText(invite.signup_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="ml-1 text-xs">{copied ? t("admin.invites.copied") : t("admin.invites.copy_link")}</span>
    </Button>
  );
}

export default function AdminInvitesPage() {
  const { t, locale } = useLocale();
  const { data, isLoading } = useInviteCodes();
  const createInvite = useCreateInviteCode();
  const revokeInvite = useRevokeInviteCode();
  const setMode = useSetRegistrationMode();
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const canEdit = data?.meta.can_edit ?? false;
  const mode = data?.meta.registration_mode;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{t("admin.invites.title")}</h1>
        <p className="text-sm text-[var(--muted)]">{t("admin.invites.subtitle")}</p>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("admin.invites.mode_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p role="status">{mode === "invite" ? t("admin.invites.mode_invite") : t("admin.invites.mode_open")}</p>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setMode.mutate(mode === "invite" ? "open" : "invite")}
                  disabled={setMode.isPending}
                >
                  {mode === "invite" ? t("admin.invites.open_registration") : t("admin.invites.require_invites")}
                </Button>
              )}
            </CardContent>
          </Card>

          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("admin.invites.create_title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  method="post"
                  className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createInvite.mutate(
                      { label: label.trim(), max_uses: Number(maxUses), expires_in_days: expiresInDays ? Number(expiresInDays) : null },
                      { onSuccess: () => setLabel("") }
                    );
                  }}
                >
                  <div className="space-y-1">
                    <label htmlFor="invite-label" className="text-xs font-semibold text-[var(--muted-soft)]">{t("admin.invites.label")}</label>
                    <Input id="invite-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("admin.invites.label_placeholder")} maxLength={120} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="invite-uses" className="text-xs font-semibold text-[var(--muted-soft)]">{t("admin.invites.max_uses")}</label>
                    <Input id="invite-uses" type="number" min={1} max={500} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="invite-expiry" className="text-xs font-semibold text-[var(--muted-soft)]">{t("admin.invites.expires_days")}</label>
                    <Input id="invite-expiry" type="number" min={1} max={365} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder={t("admin.invites.never")} />
                  </div>
                  <Button type="submit" disabled={createInvite.isPending || Number(maxUses) < 1}>
                    {t("admin.invites.create")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-[var(--muted)]">{t("admin.invites.read_only")}</p>
          )}

          <Card>
            <CardContent className="pt-6">
              {data.data.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t("admin.invites.empty")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.invites.col_code")}</TableHead>
                        <TableHead>{t("admin.invites.label")}</TableHead>
                        <TableHead>{t("admin.invites.col_uses")}</TableHead>
                        <TableHead>{t("admin.invites.col_status")}</TableHead>
                        <TableHead>{t("admin.invites.col_signed_up")}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((invite) => (
                        <TableRow key={invite.public_id}>
                          <TableCell className="font-mono text-sm">{invite.code}</TableCell>
                          <TableCell className="text-sm">{invite.label ?? "—"}</TableCell>
                          <TableCell className="text-sm">{invite.uses_count} / {invite.max_uses}</TableCell>
                          <TableCell>
                            <Badge variant={invite.status === "active" ? "default" : "subtle"}>{t(`admin.invites.status.${invite.status}`)}</Badge>
                            {invite.status === "active" && invite.expires_at && (
                              <div className="mt-1 text-xs text-[var(--muted-soft)]">
                                {t("admin.invites.until").replace("{date}", formatDate(invite.expires_at, "PP", locale))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-[var(--muted)]">
                            {(invite.redeemed_by ?? []).map((user) => (
                              <div key={user.email}>{user.name}{user.workspace ? ` · ${user.workspace}` : ""}</div>
                            ))}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {invite.status === "active" && <CopyLinkButton invite={invite} />}
                            {canEdit && invite.status === "active" && (
                              <Button variant="outline" size="sm" onClick={() => revokeInvite.mutate(invite.public_id)} disabled={revokeInvite.isPending}>
                                {t("admin.invites.revoke")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
