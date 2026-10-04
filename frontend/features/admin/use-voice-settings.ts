import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

export type VoiceSettings = {
  enabled: boolean;
  zero_retention: boolean;
  has_api_key: boolean;
  api_key_last4: string | null;
  available: boolean;
  can_edit: boolean;
};

const KEY = ["admin", "voice"];

export function useVoiceSettings() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<{ data: VoiceSettings }>("/api/v1/admin/voice") });
}

export function useSaveVoiceSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: { enabled: boolean; zero_retention: boolean; api_key?: string }) =>
      apiPut<{ data: VoiceSettings }>("/api/v1/admin/voice", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ["voice-status"] });
      toast({ title: t("admin.voice.saved"), variant: "success" });
    },
    onError: (error) => toast({ title: t("admin.voice.save_failed"), description: error.message, variant: "error" }),
  });
}

export function useTestVoiceKey() {
  return useMutation({
    mutationFn: () => apiPost<{ data: { ok: boolean; error: string | null } }>("/api/v1/admin/voice/test", {}),
  });
}
