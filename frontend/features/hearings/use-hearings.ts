import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";

export type HearingSummary = {
  public_id: string;
  case_id: number;
  case_public_id?: string | null;
  case_title?: string | null;
  hearing_at: string | null;
  type: string | null;
  agenda: string | null;
  location: string | null;
  outcome: string | null;
  minutes: string | null;
  next_steps: string | null;
  created_at: string;
};

type HearingListResponse = {
  data: HearingSummary[];
};

export function useHearings() {
  return useQuery({
    queryKey: ["hearings"],
    queryFn: () => apiGet<HearingListResponse>("/api/v1/hearings"),
  });
}

export function useCaseHearings(casePublicId: string) {
  return useQuery({
    queryKey: ["cases", casePublicId, "hearings"],
    queryFn: () =>
      apiGet<HearingListResponse>(`/api/v1/cases/${casePublicId}/hearings`),
    enabled: Boolean(casePublicId),
  });
}

type CreateHearingPayload = {
  case_public_id: string;
  hearing_at: string;
  type: string;
  agenda?: string;
  location?: string;
  outcome?: string;
  minutes?: string;
  next_steps?: string;
};

export function useCreateHearing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateHearingPayload) =>
      apiPost<HearingSummary>("/api/v1/hearings", payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id, "hearings"],
      });
    },
  });
}

type UpdateHearingPayload = {
  publicId: string;
  data: Partial<CreateHearingPayload>;
};

export function useUpdateHearing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateHearingPayload) =>
      apiPut<HearingSummary>(`/api/v1/hearings/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
    },
  });
}

export function useDeleteHearing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/hearings/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
    },
  });
}
