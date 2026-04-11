"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { Input } from "@/components/ui/input";
import { useAuth, useUpdateProfile, useUpdateTenant } from "@/features/auth/use-auth";
import {
  useDeletePushSubscription,
  usePushSubscriptions,
  useSavePushSubscription,
} from "@/features/notifications/use-push-subscriptions";
import { useToast } from "@/components/ui/use-toast";
import { apiGetBlob } from "@/lib/api-client";

function filenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) {
    return fallback;
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallback;
}

function toUint8Array(base64String: string): Uint8Array {
  const padded = base64String.padEnd(
    base64String.length + ((4 - (base64String.length % 4)) % 4),
    "="
  );
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SettingsPage() {
  const { t } = useLocale();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const hasAuditExport = Boolean(user?.tenant?.plan_limits?.has_audit_export);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [auditRange, setAuditRange] = useState<"30" | "90" | "365" | "all">("90");
  const [isExportingAudit, setIsExportingAudit] = useState(false);
  const { data: subscriptionsData, isLoading: subscriptionsLoading } =
    usePushSubscriptions();
  const saveSubscription = useSavePushSubscription();
  const deleteSubscription = useDeletePushSubscription();
  const subscriptions = subscriptionsData?.data ?? [];
  const hasPushEnabled = subscriptions.length > 0;
  const isBusy = saveSubscription.isPending || deleteSubscription.isPending;

  const updateProfile = useUpdateProfile();
  const updateTenant = useUpdateTenant();
  const [firmName, setFirmName] = useState(user?.tenant?.name ?? "");
  const [firmNameError, setFirmNameError] = useState("");
  const [waPhone, setWaPhone] = useState(user?.whatsapp_phone ?? "");
  const [waPhoneError, setWaPhoneError] = useState("");
  const waPhoneRef = useRef<HTMLInputElement>(null);
  const waOptedIn = user?.whatsapp_opted_in ?? false;
  const waIsBusy = updateProfile.isPending;

  const activeEndpointHash = useMemo(() => {
    if (!subscriptions.length) {
      return null;
    }
    return subscriptions[0].endpoint_hash;
  }, [subscriptions]);

  const handleAuditExport = async () => {
    try {
      setIsExportingAudit(true);
      const query = new URLSearchParams();
      query.set("days", auditRange);

      const response = await apiGetBlob(`/api/v1/billing/audit-export?${query.toString()}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const filename = filenameFromDisposition(
        response.headers.get("content-disposition"),
        "casedex-audit-export.csv"
      );

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);

      toast({
        title: t("settings.audit.success_title"),
        description: t("settings.audit.success_desc"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("settings.audit.failed_title"),
        description: error instanceof Error ? error.message : t("settings.audit.failed_desc"),
        variant: "error",
      });
    } finally {
      setIsExportingAudit(false);
    }
  };

  const handleEnablePush = async () => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      toast({
        title: t("settings.push.unsupported_title"),
        description: t("settings.push.unsupported_desc"),
        variant: "error",
      });
      return;
    }

    if (!vapidPublicKey) {
      toast({
        title: t("settings.push.config_title"),
        description: t("settings.push.config_desc"),
        variant: "error",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast({
        title: t("settings.push.permission_title"),
        description: t("settings.push.permission_desc"),
        variant: "error",
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    const payload = subscription.toJSON();
    const p256dhKey = payload.keys?.p256dh;
    const authKey = payload.keys?.auth;

    if (!payload.endpoint || !p256dhKey || !authKey) {
      toast({
        title: t("settings.push.failed_title"),
        description: t("settings.push.failed_desc"),
        variant: "error",
      });
      return;
    }

    saveSubscription.mutate(
      {
        endpoint: payload.endpoint,
        p256dh_key: p256dhKey,
        auth_key: authKey,
        content_encoding: "aes128gcm",
        user_agent: navigator.userAgent,
      },
      {
        onSuccess: () => {
          toast({
            title: t("settings.push.enabled_title"),
            description: t("settings.push.enabled_desc"),
            variant: "success",
          });
        },
        onError: () => {
          toast({
            title: t("settings.push.failed_title"),
            description: t("settings.push.failed_desc"),
            variant: "error",
          });
        },
      }
    );
  };

  const handleDisablePush = async () => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    const endpoint = subscription?.endpoint ?? null;

    if (subscription) {
      await subscription.unsubscribe();
    }

    const match = subscriptions.find((item) => item.endpoint === endpoint);
    const endpointHash = match?.endpoint_hash ?? activeEndpointHash;

    if (!endpointHash) {
      toast({
        title: t("settings.push.disabled_title"),
        description: t("settings.push.disabled_desc"),
        variant: "success",
      });
      return;
    }

    deleteSubscription.mutate(endpointHash, {
      onSuccess: () => {
        toast({
          title: t("settings.push.disabled_title"),
          description: t("settings.push.disabled_desc"),
          variant: "success",
        });
      },
      onError: () => {
        toast({
          title: t("settings.push.failed_title"),
          description: t("settings.push.failed_desc"),
          variant: "error",
        });
      },
    });
  };

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
            {t("settings.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("settings.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted)]">
          {t("settings.description")}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {isAdmin && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{t("settings.firm_card")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted)]">
              <p>{t("settings.firm_card_desc")}</p>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("settings.firm_name_label")}
                </label>
                <Input
                  value={firmName}
                  onChange={(e) => {
                    setFirmName(e.target.value);
                    setFirmNameError("");
                  }}
                  placeholder={t("settings.firm_name_placeholder")}
                  aria-invalid={!!firmNameError}
                />
                {firmNameError && (
                  <p className="text-xs text-[var(--error)]">{firmNameError}</p>
                )}
              </div>
              <Button
                disabled={updateTenant.isPending}
                onClick={() => {
                  const name = firmName.trim();
                  if (!name) {
                    setFirmNameError(t("settings.firm_name_required"));
                    return;
                  }
                  updateTenant.mutate({ name });
                }}
              >
                {updateTenant.isPending ? t("common.saving") : t("settings.firm_save")}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{t("settings.profile_card")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--muted)]">
              <p>{t("settings.profile_card_desc")}</p>
            <Button asChild className="mt-3">
              <Link href="/settings/profile">{t("settings.profile_card_action")}</Link>
            </Button>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{t("settings.team_card")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted)]">
                <p>{t("settings.team_card_desc")}</p>
              <Button asChild className="mt-3">
                <Link href="/settings/team">{t("settings.team_card_action")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{t("settings.audit.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted)]">
              {hasAuditExport ? (
                <>
                  <p>{t("settings.audit.desc")}</p>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                      {t("settings.audit.range_label")}
                    </label>
                    <select
                      value={auditRange}
                      onChange={(event) => setAuditRange(event.target.value as "30" | "90" | "365" | "all")}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                    >
                      <option value="30">{t("settings.audit.range_30")}</option>
                      <option value="90">{t("settings.audit.range_90")}</option>
                      <option value="365">{t("settings.audit.range_365")}</option>
                      <option value="all">{t("settings.audit.range_all")}</option>
                    </select>
                  </div>
                  <p className="text-xs text-[var(--muted-soft)]">{t("settings.audit.includes")}</p>
                  <Button onClick={handleAuditExport} disabled={isExportingAudit}>
                    {isExportingAudit ? t("settings.audit.export_pending") : t("settings.audit.export")}
                  </Button>
                </>
              ) : (
                <>
                  <p>{t("settings.audit.upgrade_desc")}</p>
                  <Button asChild variant="outline">
                    <Link href="/settings/billing">{t("settings.audit.upgrade_action")}</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{t("settings.push.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--muted)]">
            <p>{t("settings.push.desc")}</p>
            <p className="text-xs text-[var(--muted-soft)]">
              {hasPushEnabled
                ? t("settings.push.status_enabled")
                : t("settings.push.status_disabled")}
            </p>
            <Button
              onClick={hasPushEnabled ? handleDisablePush : handleEnablePush}
              disabled={isBusy || subscriptionsLoading}
              variant={hasPushEnabled ? "outline" : "default"}
            >
              {hasPushEnabled
                ? t("settings.push.disable")
                : t("settings.push.enable")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{t("settings.whatsapp.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--muted)]">
            <p>{t("settings.whatsapp.desc")}</p>
            <div className="space-y-2">
              <Input
                ref={waPhoneRef}
                type="tel"
                placeholder={t("settings.whatsapp.phone_placeholder")}
                value={waPhone}
                onChange={(e) => {
                  setWaPhone(e.target.value);
                  setWaPhoneError("");
                }}
                aria-invalid={!!waPhoneError}
              />
              {waPhoneError && (
                <p className="text-xs text-[var(--error)]">{waPhoneError}</p>
              )}
            </div>
            <p className="text-xs text-[var(--muted-soft)]">
              {waOptedIn
                ? t("settings.whatsapp.status_enabled")
                : t("settings.whatsapp.status_disabled")}
            </p>
            <Button
              onClick={() => {
                if (!waOptedIn) {
                  const phone = waPhone.trim();
                  if (!/^\+880[0-9]{10}$/.test(phone)) {
                    setWaPhoneError(t("settings.whatsapp.phone_error"));
                    waPhoneRef.current?.focus();
                    return;
                  }
                  updateProfile.mutate(
                    {
                      name: user?.name ?? "",
                      email: user?.email ?? "",
                      country_id: user?.country_id ?? 1,
                      whatsapp_phone: phone,
                      whatsapp_opted_in: true,
                    },
                    {
                      onSuccess: () => {
                        toast({
                          title: t("settings.whatsapp.enabled_title"),
                          description: t("settings.whatsapp.enabled_desc"),
                          variant: "success",
                        });
                      },
                      onError: () => {
                        toast({
                          title: t("settings.whatsapp.failed_title"),
                          description: t("settings.whatsapp.failed_desc"),
                          variant: "error",
                        });
                      },
                    }
                  );
                } else {
                  updateProfile.mutate(
                    {
                      name: user?.name ?? "",
                      email: user?.email ?? "",
                      country_id: user?.country_id ?? 1,
                      whatsapp_opted_in: false,
                    },
                    {
                      onSuccess: () => {
                        toast({
                          title: t("settings.whatsapp.disabled_title"),
                          description: t("settings.whatsapp.disabled_desc"),
                          variant: "success",
                        });
                      },
                      onError: () => {
                        toast({
                          title: t("settings.whatsapp.failed_title"),
                          description: t("settings.whatsapp.failed_desc"),
                          variant: "error",
                        });
                      },
                    }
                  );
                }
              }}
              disabled={waIsBusy}
              variant={waOptedIn ? "outline" : "default"}
            >
              {waOptedIn
                ? t("settings.whatsapp.disable")
                : t("settings.whatsapp.enable")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{t("billing.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--muted)]">
            <p>{t("billing.subtitle")}</p>
            <Button asChild className="mt-3">
              <Link href="/settings/billing">{t("nav.billing")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </section>
  );
}
