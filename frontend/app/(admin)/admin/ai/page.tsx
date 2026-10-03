"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/locale-provider";
import {
  type AiProviderSetting,
  type AiProviderTestResult,
  useActivateAiProvider,
  useAiProviders,
  useDeactivateAiProviders,
  useSaveAiProvider,
  useTestAiProvider,
} from "@/features/admin/use-ai-providers";

function ProviderCard({ provider, canEdit }: { provider: AiProviderSetting; canEdit: boolean }) {
  const { t } = useLocale();
  const [model, setModel] = useState(provider.model);
  const [apiKey, setApiKey] = useState("");
  const [testResult, setTestResult] = useState<AiProviderTestResult | null>(null);
  const save = useSaveAiProvider();
  const activate = useActivateAiProvider();
  const test = useTestAiProvider();
  const id = `ai-${provider.provider}`;

  return (
    <Card role="region" aria-label={provider.label} className={provider.is_active ? "border-[var(--foreground)]" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{provider.label}</CardTitle>
        <div className="flex gap-2">
          {provider.is_active && <Badge>{t("admin.ai.active")}</Badge>}
          {provider.last_test_ok === true && <Badge variant="subtle">{t("admin.ai.test_passed")}</Badge>}
          {provider.last_test_ok === false && <Badge variant="subtle">{t("admin.ai.test_failed")}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <form
          method="post"
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              { provider: provider.provider, model, apiKey },
              { onSuccess: () => setApiKey("") }
            );
          }}
        >
          <div className="space-y-1">
            <label htmlFor={`${id}-model`} className="text-xs font-semibold text-[var(--muted-soft)]">
              {t("admin.ai.model")}
            </label>
            <Input
              id={`${id}-model`}
              list={`${id}-models`}
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={provider.default_model}
              disabled={!canEdit}
            />
            <datalist id={`${id}-models`}>
              {provider.suggested_models.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <label htmlFor={`${id}-key`} className="text-xs font-semibold text-[var(--muted-soft)]">
              {t("admin.ai.api_key")}
            </label>
            <Input
              id={`${id}-key`}
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={
                provider.has_api_key
                  ? t("admin.ai.key_saved").replace("{last4}", provider.api_key_last4 ?? "")
                  : t("admin.ai.key_missing")
              }
              disabled={!canEdit}
            />
            <a href={provider.key_url} target="_blank" rel="noreferrer" className="text-xs underline-offset-4 hover:underline">
              {t("admin.ai.get_key")}
            </a>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={save.isPending || model.trim() === ""}>
                {t("admin.ai.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!provider.has_api_key || test.isPending}
                onClick={() => test.mutate(provider.provider, { onSuccess: (res) => setTestResult(res.data) })}
              >
                {test.isPending ? t("admin.ai.testing") : t("admin.ai.test")}
              </Button>
              {!provider.is_active && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!provider.has_api_key || activate.isPending}
                  onClick={() => activate.mutate(provider.provider)}
                >
                  {t("admin.ai.activate")}
                </Button>
              )}
            </div>
          )}
        </form>
        {testResult && (
          <p role="status" className={testResult.ok ? "text-emerald-700" : "text-rose-600"}>
            {testResult.ok
              ? t("admin.ai.test_ok").replace("{ms}", String(testResult.latency_ms)).replace("{reply}", testResult.reply ?? "")
              : `${t("admin.ai.test_error")} ${testResult.error ?? ""}`}
          </p>
        )}
        {provider.updated_by && (
          <p className="text-xs text-[var(--muted-soft)]">
            {t("admin.ai.updated_by").replace("{name}", provider.updated_by)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAiPage() {
  const { t } = useLocale();
  const { data, isLoading } = useAiProviders();
  const deactivate = useDeactivateAiProviders();
  const inUse = data?.meta.in_use;
  const canEdit = data?.meta.can_edit ?? false;
  const activeProvider = data?.data.find((item) => item.is_active);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{t("admin.ai.title")}</h1>
        <p className="text-sm text-[var(--muted)]">{t("admin.ai.subtitle")}</p>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
              <p role="status">
                {!inUse?.configured
                  ? t("admin.ai.in_use_none")
                  : activeProvider
                    ? t("admin.ai.in_use_admin").replace("{provider}", activeProvider.label).replace("{model}", inUse.model)
                    : t("admin.ai.in_use_env").replace("{model}", inUse?.model ?? "")}
              </p>
              {canEdit && activeProvider && (
                <Button variant="outline" size="sm" onClick={() => deactivate.mutate(undefined)} disabled={deactivate.isPending}>
                  {t("admin.ai.use_env")}
                </Button>
              )}
            </CardContent>
          </Card>
          {!canEdit && <p className="text-sm text-[var(--muted)]">{t("admin.ai.read_only")}</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            {data.data.map((provider) => (
              <ProviderCard key={provider.provider} provider={provider} canEdit={canEdit} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
