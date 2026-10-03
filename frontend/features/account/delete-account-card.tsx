"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { hardNavigate } from "@/lib/hard-navigate";
import { clearOfflineUserData } from "@/pwa/offline-cache";
import { useDeletionPreflight, useRequestAccountDeletion } from "@/features/account/use-account-deletion";

/**
 * Settings "Delete account": a 30-day grace period, cancelled by signing in.
 * Blocked for the only admin of a workspace that still has members.
 */
export default function DeleteAccountCard() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading } = useDeletionPreflight();
  const requestDeletion = useRequestAccountDeletion();
  const [password, setPassword] = useState("");
  const [understood, setUnderstood] = useState(false);
  const preflight = data?.data;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    requestDeletion.mutate(password, {
      onSuccess: async () => {
        await clearOfflineUserData();
        queryClient.setQueryData(["auth-me"], null);
        hardNavigate("/login?account_deleted=1");
      },
    });
  };

  return (
    <Card className="border-rose-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">{t("account_delete.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--muted)]">
        {isLoading || !preflight ? (
          <Skeleton className="h-16 w-full" />
        ) : !preflight.can_delete ? (
          <>
            <p>{t("account_delete.handover")}</p>
            <Button variant="outline" asChild>
              <Link href="/settings/team">{t("account_delete.go_to_team")}</Link>
            </Button>
          </>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <p>{t("account_delete.desc").replace("{days}", String(preflight.grace_days))}</p>
            {preflight.workspace_will_be_deleted && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
                {t("account_delete.workspace_warning")}
              </p>
            )}
            <div className="space-y-1">
              <label htmlFor="delete-account-password" className="text-xs font-semibold text-[var(--muted-soft)]">
                {t("account_delete.password")}
              </label>
              <Input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={requestDeletion.isError}
              />
            </div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={understood}
                onChange={(event) => setUnderstood(event.target.checked)}
              />
              <span>{t("account_delete.confirm")}</span>
            </label>
            {requestDeletion.isError && (
              <p className="text-rose-600" role="alert">
                {requestDeletion.error.message}
              </p>
            )}
            <Button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={!understood || password === "" || requestDeletion.isPending}
            >
              {requestDeletion.isPending ? t("account_delete.pending") : t("account_delete.submit")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
