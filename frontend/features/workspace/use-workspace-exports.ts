import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

export type WorkspaceExport = {
  public_id: string;
  status: "pending" | "ready" | "failed" | "expired";
  reason: "manual" | "account_deletion";
  size_bytes: number | null;
  requested_by: string | null;
  created_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  download_url: string | null;
};

const EXPORTS_KEY = ["workspace-exports"];

export function useWorkspaceExports(enabled: boolean) {
  return useQuery({
    queryKey: EXPORTS_KEY,
    queryFn: () => apiGet<{ data: WorkspaceExport[] }>("/api/v1/workspace/exports"),
    enabled,
    // Keep checking while an export is being built.
    refetchInterval: (query) =>
      query.state.data?.data.some((item) => item.status === "pending") ? 5000 : false,
  });
}

export function useRequestWorkspaceExport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: () => apiPost<{ data: WorkspaceExport }>("/api/v1/workspace/exports", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPORTS_KEY });
      toast({ title: t("export.requested"), description: t("export.requested_desc"), variant: "success" });
    },
    onError: (error) => {
      toast({ title: t("export.request_failed"), description: error.message, variant: "error" });
    },
  });
}
