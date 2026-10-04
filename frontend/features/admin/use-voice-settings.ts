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
  associate_configured: boolean;
  can_edit: boolean;
};

export type AssociateTenant = { public_id: string; name: string; associate_enabled: boolean };

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

/** Creates or updates the junior associate agent in ElevenLabs. */
export function useSyncAssociate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: () => apiPost<{ data: VoiceSettings }>("/api/v1/admin/voice/associate/sync", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast({ title: t("admin.voice.associate_synced"), variant: "success" });
    },
    onError: (error) => toast({ title: t("admin.voice.associate_sync_failed"), description: error.message, variant: "error" }),
  });
}

export function useAssociateTenants(search: string) {
  return useQuery({
    queryKey: [...KEY, "associate-tenants", search],
    queryFn: () =>
      apiGet<{ data: AssociateTenant[] }>(`/api/v1/admin/voice/associate-tenants?search=${encodeURIComponent(search)}`),
  });
}

export function useSetAssociateTenant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ publicId, enabled }: { publicId: string; enabled: boolean }) =>
      apiPut<{ data: { public_id: string; associate_enabled: boolean } }>(`/api/v1/admin/voice/associate-tenants/${publicId}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...KEY, "associate-tenants"] }),
    onError: (error) => toast({ title: t("admin.voice.save_failed"), description: error.message, variant: "error" }),
  });
}
