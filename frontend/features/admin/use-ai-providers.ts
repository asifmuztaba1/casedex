import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

export type AiProviderKey = "gemini" | "groq" | "openai" | "openrouter";

export type AiProviderSetting = {
  provider: AiProviderKey;
  label: string;
  model: string;
  base_url: string;
  has_api_key: boolean;
  api_key_last4: string | null;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  updated_by: string | null;
  updated_at: string | null;
  default_model: string;
  suggested_models: string[];
  key_url: string;
};

export type AiProvidersResponse = {
  data: AiProviderSetting[];
  meta: {
    in_use: { source: string; model: string; configured: boolean };
    can_edit: boolean;
  };
};

export type AiProviderTestResult = { ok: boolean; latency_ms: number; reply: string | null; error: string | null };

const KEY = ["admin", "ai-providers"];

export function useAiProviders() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<AiProvidersResponse>("/api/v1/admin/ai-providers") });
}

function useProviderMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>, successKey: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast({ title: t(successKey), variant: "success" });
    },
    onError: (error) => {
      toast({ title: t("admin.ai.save_failed"), description: error.message, variant: "error" });
    },
  });
}

export function useSaveAiProvider() {
  return useProviderMutation(
    ({ provider, model, apiKey }: { provider: AiProviderKey; model: string; apiKey: string }) =>
      apiPut<{ data: AiProviderSetting }>(`/api/v1/admin/ai-providers/${provider}`, {
        model,
        ...(apiKey ? { api_key: apiKey } : {}),
      }),
    "admin.ai.saved"
  );
}

export function useActivateAiProvider() {
  return useProviderMutation(
    (provider: AiProviderKey) => apiPost<{ data: AiProviderSetting }>(`/api/v1/admin/ai-providers/${provider}/activate`, {}),
    "admin.ai.activated"
  );
}

export function useDeactivateAiProviders() {
  return useProviderMutation(() => apiPost("/api/v1/admin/ai-providers/deactivate", {}), "admin.ai.deactivated");
}

export function useTestAiProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: AiProviderKey) =>
      apiPost<{ data: AiProviderTestResult }>(`/api/v1/admin/ai-providers/${provider}/test`, {}),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
