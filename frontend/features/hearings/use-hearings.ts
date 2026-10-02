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

export type HearingSummary = {
  public_id: string;
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
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: CreateHearingPayload) =>
      apiPost<HearingSummary>("/api/v1/hearings", payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id, "hearings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id],
      });
      toast({
        title: t("toast.hearing_saved"),
        description: t("toast.hearing_saved_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.hearing_not_saved"),
        description: getErrorMessage(error),
        variant: "error",
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
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateHearingPayload) =>
      apiPut<HearingSummary>(`/api/v1/hearings/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
      toast({
        title: t("toast.hearing_updated"),
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

export function useDeleteHearing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/hearings/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
      toast({
        title: t("toast.hearing_removed"),
        description: t("toast.hearing_removed_desc"),
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
