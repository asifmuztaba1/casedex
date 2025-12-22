import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { CaseParticipantSummary } from "@/features/cases/use-cases";

type CaseParticipantListResponse = {
  data: CaseParticipantSummary[];
};

export function useCaseParticipants(casePublicId: string) {
  return useQuery({
    queryKey: ["cases", casePublicId, "participants"],
    queryFn: () =>
      apiGet<CaseParticipantListResponse>(
        `/api/v1/cases/${casePublicId}/participants`
      ),
    enabled: Boolean(casePublicId),
  });
}

type AddParticipantPayload = {
  casePublicId: string;
  user_public_id: string;
  role: string;
};

export function useAddCaseParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddParticipantPayload) =>
      apiPost<CaseParticipantSummary>(
        `/api/v1/cases/${payload.casePublicId}/participants`,
        {
          user_public_id: payload.user_public_id,
          role: payload.role,
        }
      ),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "participants"],
      });
    },
  });
}

type RemoveParticipantPayload = {
  casePublicId: string;
  participantId: number;
};

export function useRemoveCaseParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casePublicId, participantId }: RemoveParticipantPayload) =>
      apiDelete(`/api/v1/cases/${casePublicId}/participants/${participantId}`),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "participants"],
      });
    },
  });
}
