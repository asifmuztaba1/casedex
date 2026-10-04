"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/locale-provider";
import {
  type VoiceSettings,
  useAssociateTenants,
  useSaveVoiceSettings,
  useSetAssociateTenant,
  useSyncAssociate,
  useTestVoiceKey,
  useVoiceSettings,
} from "@/features/admin/use-voice-settings";

function VoiceSettingsForm({ settings }: { settings: VoiceSettings }) {
  const { t } = useLocale();
  const save = useSaveVoiceSettings();
  const test = useTestVoiceKey();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [zeroRetention, setZeroRetention] = useState(settings.zero_retention);
  const [apiKey, setApiKey] = useState("");
  const canEdit = settings.can_edit;

  return (
    <form
      method="post"
      className="space-y-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { enabled, zero_retention: zeroRetention, ...(apiKey ? { api_key: apiKey } : {}) },
          { onSuccess: () => setApiKey("") }
        );
      }}
    >
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!canEdit} />
        <span>{t("admin.voice.enabled")}</span>
      </label>
      <div className="space-y-1">
        <label htmlFor="voice-api-key" className="text-xs font-semibold text-[var(--muted-soft)]">
          {t("admin.voice.api_key")}
        </label>
        <Input
          id="voice-api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            settings.has_api_key
              ? t("admin.ai.key_saved").replace("{last4}", settings.api_key_last4 ?? "")
              : t("admin.ai.key_missing")
          }
          disabled={!canEdit}
        />
        <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer" className="text-xs underline-offset-4 hover:underline">
          {t("admin.ai.get_key")}
        </a>
      </div>
      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-0.5" checked={zeroRetention} onChange={(e) => setZeroRetention(e.target.checked)} disabled={!canEdit} />
        <span>
          {t("admin.voice.zero_retention")}
          <span className="block text-xs text-[var(--muted-soft)]">{t("admin.voice.zero_retention_hint")}</span>
        </span>
      </label>
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>{t("admin.ai.save")}</Button>
          <Button type="button" variant="outline" disabled={!settings.has_api_key || test.isPending} onClick={() => test.mutate()}>
            {test.isPending ? t("admin.ai.testing") : t("admin.ai.test")}
          </Button>
        </div>
      )}
      {test.data && (
        <p role="status" className={test.data.data.ok ? "text-emerald-700" : "text-rose-600"}>
          {test.data.data.ok ? t("admin.voice.test_ok") : `${t("admin.ai.test_error")} ${test.data.data.error ?? ""}`}
        </p>
      )}
    </form>
  );
}

function AssociateSettings({ settings }: { settings: VoiceSettings }) {
  const { t } = useLocale();
  const sync = useSyncAssociate();
  const setTenant = useSetAssociateTenant();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAssociateTenants(search.trim());
  const firms = data?.data ?? [];
  const canEdit = settings.can_edit;

  return (
    <div className="space-y-4 text-sm">
      <p className="text-[var(--muted)]">{t("admin.voice.associate_desc")}</p>
      {canEdit && (
        <Button type="button" variant="outline" disabled={!settings.available || sync.isPending} onClick={() => sync.mutate()}>
          {sync.isPending
            ? t("admin.voice.associate_syncing")
            : settings.associate_configured
              ? t("admin.voice.associate_resync")
              : t("admin.voice.associate_setup")}
        </Button>
      )}
      {!settings.available && <p className="text-xs text-[var(--muted-soft)]">{t("admin.voice.associate_needs_voice")}</p>}

      <div className="space-y-2">
        <label htmlFor="associate-firm-search" className="text-xs font-semibold text-[var(--muted-soft)]">
          {t("admin.voice.associate_firms")}
        </label>
        <Input
          id="associate-firm-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.voice.associate_search")}
        />
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : firms.length === 0 ? (
          <p className="text-xs text-[var(--muted-soft)]">{t("admin.voice.associate_no_firms")}</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
            {firms.map((firm) => (
              <li key={firm.public_id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>
                  {firm.name}
                  {firm.admin_email && <span className="block text-xs text-[var(--muted-soft)]">{firm.admin_email}</span>}
                </span>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={firm.associate_enabled}
                    disabled={!canEdit || setTenant.isPending}
                    onChange={(e) => setTenant.mutate({ publicId: firm.public_id, enabled: e.target.checked })}
                  />
                  {t("admin.voice.associate_in_beta")}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminVoicePage() {
  const { t } = useLocale();
  const { data, isLoading } = useVoiceSettings();
  const settings = data?.data;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{t("admin.voice.title")}</h1>
        <p className="text-sm text-[var(--muted)]">{t("admin.voice.subtitle")}</p>
      </div>
      {isLoading || !settings ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">ElevenLabs</CardTitle>
            <Badge variant={settings.available ? "default" : "subtle"}>
              {settings.available ? t("admin.voice.status_on") : t("admin.voice.status_off")}
            </Badge>
          </CardHeader>
          <CardContent>
            {!settings.can_edit && <p className="mb-3 text-sm text-[var(--muted)]">{t("admin.ai.read_only")}</p>}
            <VoiceSettingsForm settings={settings} />
          </CardContent>
        </Card>
      )}
      {settings && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{t("admin.voice.associate_title")}</CardTitle>
            <Badge variant={settings.associate_configured ? "default" : "subtle"}>
              {settings.associate_configured ? t("admin.voice.associate_ready") : t("admin.voice.associate_not_set_up")}
            </Badge>
          </CardHeader>
          <CardContent>
            <AssociateSettings settings={settings} />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
