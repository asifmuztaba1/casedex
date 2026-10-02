import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return translate(getStoredLocale(), "common.something_wrong");
}
import { CaseParticipantSummary } from "@/features/cases/use-cases";
import { useLocale } from "@/components/locale-provider";
import { translate } from "@/lib/i18n";
import { getStoredLocale } from "@/lib/locale";

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
  const { toast } = useToast();
  const { t } = useLocale();

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
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId],
      });
      toast({
        title: t("toast.participant_added"),
        description: t("toast.participant_added_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.add_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type RemoveParticipantPayload = {
  casePublicId: string;
  participantPublicId: string;
};

export function useRemoveCaseParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ casePublicId, participantPublicId }: RemoveParticipantPayload) =>
      apiDelete(`/api/v1/cases/${casePublicId}/participants/${participantPublicId}`),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "participants"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId],
      });
      toast({
        title: t("toast.participant_removed"),
        description: t("toast.participant_removed_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.remove_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}
