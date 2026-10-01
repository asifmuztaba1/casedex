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

export type DiaryEntrySummary = {
  public_id: string;
  case_id: number;
  case_public_id?: string | null;
  case_title?: string | null;
  hearing_id: number | null;
  entry_at: string | null;
  title: string | null;
  body: string | null;
  created_at: string;
};

type DiaryEntryListResponse = {
  data: DiaryEntrySummary[];
};

export function useDiaryEntries() {
  return useQuery({
    queryKey: ["diary-entries"],
    queryFn: () => apiGet<DiaryEntryListResponse>("/api/v1/diary-entries"),
  });
}

export function useCaseDiaryEntries(casePublicId: string) {
  return useQuery({
    queryKey: ["cases", casePublicId, "diary"],
    queryFn: () =>
      apiGet<DiaryEntryListResponse>(`/api/v1/cases/${casePublicId}/diary`),
    enabled: Boolean(casePublicId),
  });
}

type CreateDiaryEntryPayload = {
  case_public_id: string;
  hearing_public_id?: string;
  entry_at: string;
  title: string;
  body: string;
};

export function useCreateDiaryEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: CreateDiaryEntryPayload) =>
      apiPost<DiaryEntrySummary>("/api/v1/diary-entries", payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id, "diary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id],
      });
      toast({
        title: t("toast.diary_saved"),
        description: t("toast.diary_saved_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.entry_not_saved"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateDiaryEntryPayload = {
  publicId: string;
  data: Partial<CreateDiaryEntryPayload>;
};

export function useUpdateDiaryEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateDiaryEntryPayload) =>
      apiPut<DiaryEntrySummary>(`/api/v1/diary-entries/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      toast({
        title: t("toast.diary_updated"),
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

export function useDeleteDiaryEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/diary-entries/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      toast({
        title: t("toast.diary_removed"),
        description: t("toast.diary_removed_desc"),
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
