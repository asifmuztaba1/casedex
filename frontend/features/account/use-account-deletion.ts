import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

export type DeletionPreflight = {
  can_delete: boolean;
  blocked_reason: "handover_required" | null;
  workspace_will_be_deleted: boolean;
  grace_days: number;
};

export function useDeletionPreflight() {
  return useQuery({
    queryKey: ["account-deletion"],
    queryFn: () => apiGet<{ data: DeletionPreflight }>("/api/v1/account/deletion"),
  });
}

export function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: (password: string) =>
      apiPost<{ data: { scheduled_for: string; workspace_will_be_deleted: boolean } }>(
        "/api/v1/account/deletion",
        { password }
      ),
  });
}
