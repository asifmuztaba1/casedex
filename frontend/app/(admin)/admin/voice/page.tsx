"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/locale-provider";
import { type VoiceSettings, useSaveVoiceSettings, useTestVoiceKey, useVoiceSettings } from "@/features/admin/use-voice-settings";

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
    </section>
  );
}
