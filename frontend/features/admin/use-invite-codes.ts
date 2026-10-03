import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

export type InviteCode = {
  public_id: string;
  code: string;
  label: string | null;
  status: "active" | "used_up" | "expired" | "revoked";
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string | null;
  created_by: string | null;
  signup_url: string;
  redeemed_by?: { name: string; email: string; workspace: string | null; signed_up_at: string | null }[];
};

type InviteCodesResponse = {
  data: InviteCode[];
  meta: { registration_mode: "invite" | "open"; can_edit: boolean };
};

const KEY = ["admin", "invite-codes"];

export function useInviteCodes() {
  return useQuery({ queryKey: KEY, queryFn: () => apiGet<InviteCodesResponse>("/api/v1/admin/invite-codes") });
}

function useInviteMutation<TVars>(fn: (vars: TVars) => Promise<unknown>, successKey: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast({ title: t(successKey), variant: "success" });
    },
    onError: (error) => toast({ title: t("admin.invites.failed"), description: error.message, variant: "error" }),
  });
}

export function useCreateInviteCode() {
  return useInviteMutation(
    (payload: { label: string; max_uses: number; expires_in_days: number | null }) =>
      apiPost("/api/v1/admin/invite-codes", payload),
    "admin.invites.created"
  );
}

export function useRevokeInviteCode() {
  return useInviteMutation((publicId: string) => apiPost(`/api/v1/admin/invite-codes/${publicId}/revoke`, {}), "admin.invites.revoked");
}

export function useSetRegistrationMode() {
  return useInviteMutation((mode: "invite" | "open") => apiPut("/api/v1/admin/registration-mode", { mode }), "admin.invites.mode_saved");
}
