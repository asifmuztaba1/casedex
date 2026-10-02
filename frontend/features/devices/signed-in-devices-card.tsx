"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/date-format";
import {
  type MobileDevice,
  useMobileDevices,
  useSignOutAllDevices,
  useSignOutDevice,
} from "@/features/devices/use-devices";

/** Settings card: phones signed in through the mobile app, e.g. to sign out a lost one. */
export default function SignedInDevicesCard() {
  const { t, locale } = useLocale();
  const { data, isLoading, isError } = useMobileDevices();
  const signOut = useSignOutDevice();
  const signOutAll = useSignOutAllDevices();
  const [target, setTarget] = useState<MobileDevice | "all" | null>(null);
  const devices = data?.data ?? [];

  const platformLabel = (device: MobileDevice) =>
    device.platform ? t(`devices.platform.${device.platform}`) : t("devices.platform.unknown");

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">{t("devices.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--muted)]">
        <p>{t("devices.desc")}</p>

        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : isError ? (
          <p className="text-rose-600">{t("devices.load_failed")}</p>
        ) : devices.length === 0 ? (
          <p className="text-xs text-[var(--muted-soft)]">{t("devices.empty")}</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
            {devices.map((device) => (
              <li key={device.public_id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Smartphone className="h-4 w-4 shrink-0 text-[var(--muted-soft)]" aria-hidden />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[var(--foreground)]">{device.name}</div>
                    <div className="text-xs text-[var(--muted-soft)]">
                      {platformLabel(device)}
                      {" · "}
                      {device.last_used_at
                        ? `${t("devices.last_used")} ${formatDate(device.last_used_at, "PP", locale)}`
                        : t("devices.never_used")}
                      {device.push_enabled && ` · ${t("devices.push_on")}`}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTarget(device)}
                  disabled={signOut.isPending}
                  aria-label={`${t("devices.sign_out")}: ${device.name}`}
                >
                  {t("devices.sign_out")}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {devices.length > 1 && (
          <Button variant="outline" onClick={() => setTarget("all")} disabled={signOutAll.isPending}>
            {t("devices.sign_out_all")}
          </Button>
        )}
      </CardContent>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target === "all" ? t("devices.sign_out_all") : t("devices.sign_out")}
        description={
          target === "all"
            ? t("devices.confirm_all")
            : t("devices.confirm_one").replace("{device}", target?.name ?? "")
        }
        confirmLabel={target === "all" ? t("devices.sign_out_all") : t("devices.sign_out")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (target === "all") signOutAll.mutate();
          else if (target) signOut.mutate(target.public_id);
        }}
        destructive
      />
    </Card>
  );
}
