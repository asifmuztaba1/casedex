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

export type CasePartySummary = {
  id: number;
  case_id: number;
  client_id: number | null;
  type: string | null;
  name: string;
  side: string | null;
  role: string | null;
  is_client: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  identity_number: string | null;
  notes: string | null;
  created_at: string;
};

type CasePartyListResponse = {
  data: CasePartySummary[];
};

export function useCaseParties(casePublicId: string) {
  return useQuery({
    queryKey: ["cases", casePublicId, "parties"],
    queryFn: () =>
      apiGet<CasePartyListResponse>(
        `/api/v1/cases/${casePublicId}/parties`
      ),
    enabled: Boolean(casePublicId),
  });
}

type AddPartyPayload = {
  casePublicId: string;
  name: string;
  type: string;
  side: string;
  role?: string;
  is_client?: boolean;
  client_id?: number;
  create_contact?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  identity_number?: string;
  notes?: string;
};

export function useAddCaseParty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: AddPartyPayload) =>
      apiPost<CasePartySummary>(`/api/v1/cases/${payload.casePublicId}/parties`, {
        name: payload.name,
        type: payload.type,
        side: payload.side,
        role: payload.role,
        is_client: payload.is_client,
        client_id: payload.client_id,
        create_contact: payload.create_contact,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        identity_number: payload.identity_number,
        notes: payload.notes,
      }),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "parties"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId],
      });
      toast({
        title: t("toast.party_added"),
        description: t("toast.party_added_desc"),
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

type UpdatePartyPayload = {
  casePublicId: string;
  partyId: number;
  data: Partial<Omit<AddPartyPayload, "casePublicId">>;
};

export function useUpdateCaseParty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ casePublicId, partyId, data }: UpdatePartyPayload) =>
      apiPut<CasePartySummary>(
        `/api/v1/cases/${casePublicId}/parties/${partyId}`,
        data
      ),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "parties"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId],
      });
      toast({
        title: t("toast.party_updated"),
        description: t("toast.party_saved_desc"),
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

type RemovePartyPayload = {
  casePublicId: string;
  partyId: number;
};

export function useRemoveCaseParty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ casePublicId, partyId }: RemovePartyPayload) =>
      apiDelete(`/api/v1/cases/${casePublicId}/parties/${partyId}`),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "parties"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId],
      });
      toast({
        title: t("toast.party_removed"),
        description: t("toast.party_removed_desc"),
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
