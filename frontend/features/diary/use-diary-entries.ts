import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
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
        title: "Diary entry saved",
        description: "The diary entry was added.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Entry not saved",
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

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateDiaryEntryPayload) =>
      apiPut<DiaryEntrySummary>(`/api/v1/diary-entries/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      toast({
        title: "Diary entry updated",
        description: "Changes saved successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useDeleteDiaryEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/diary-entries/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      toast({
        title: "Diary entry removed",
        description: "The diary entry was deleted.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}
