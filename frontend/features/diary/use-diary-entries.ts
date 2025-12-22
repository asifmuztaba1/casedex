import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";

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

  return useMutation({
    mutationFn: (payload: CreateDiaryEntryPayload) =>
      apiPost<DiaryEntrySummary>("/api/v1/diary-entries", payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id, "diary"],
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

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateDiaryEntryPayload) =>
      apiPut<DiaryEntrySummary>(`/api/v1/diary-entries/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
    },
  });
}

export function useDeleteDiaryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/diary-entries/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
    },
  });
}
