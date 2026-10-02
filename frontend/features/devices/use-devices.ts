import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

/** A phone or tablet signed in through the CaseDex mobile app. */
export type MobileDevice = {
  public_id: string;
  name: string;
  platform: "ios" | "android" | null;
  push_enabled: boolean;
  is_current: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

const DEVICES_KEY = ["mobile-devices"];

export function useMobileDevices() {
  return useQuery({
    queryKey: DEVICES_KEY,
    queryFn: () => apiGet<{ data: MobileDevice[] }>("/api/v1/devices"),
  });
}

export function useSignOutDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/devices/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      toast({ title: t("devices.signed_out"), variant: "success" });
    },
    onError: (error) => {
      toast({ title: t("devices.sign_out_failed"), description: error.message, variant: "error" });
    },
  });
}

export function useSignOutAllDevices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    // DELETE without a body; the API answers with how many were signed out.
    mutationFn: () => apiDelete("/api/v1/devices"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      toast({ title: t("devices.all_signed_out"), variant: "success" });
    },
    onError: (error) => {
      toast({ title: t("devices.sign_out_failed"), description: error.message, variant: "error" });
    },
  });
}
