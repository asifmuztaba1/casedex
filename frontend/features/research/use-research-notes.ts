import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";
import { translate } from "@/lib/i18n";
import { getStoredLocale } from "@/lib/locale";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return translate(getStoredLocale(), "common.something_wrong");
}

export type ResearchNoteSummary = {
  public_id: string;
  title: string;
  body: string | null;
  created_at: string;
};

type ResearchNoteListResponse = {
  data: ResearchNoteSummary[];
};

export function useResearchNotes() {
  return useQuery({
    queryKey: ["research-notes"],
    queryFn: () => apiGet<ResearchNoteListResponse>("/api/v1/research-notes"),
  });
}

type CreateResearchNotePayload = {
  title: string;
  body?: string;
};

export function useCreateResearchNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: CreateResearchNotePayload) =>
      apiPost<ResearchNoteSummary>("/api/v1/research-notes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
      toast({
        title: t("toast.research_saved"),
        description: t("toast.research_saved_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.save_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useDeleteResearchNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/research-notes/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
      toast({
        title: t("toast.research_removed"),
        description: t("toast.research_removed_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("cases.toast.delete_failed_title"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateResearchNotePayload = {
  publicId: string;
  data: Partial<CreateResearchNotePayload>;
};

export function useUpdateResearchNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateResearchNotePayload) =>
      apiPut<ResearchNoteSummary>(`/api/v1/research-notes/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
      toast({
        title: t("toast.research_updated"),
        description: t("cases.toast.updated_body"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("cases.toast.update_failed_title"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}
