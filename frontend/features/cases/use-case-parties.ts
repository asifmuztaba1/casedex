import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
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
  phone?: string;
  email?: string;
  address?: string;
  identity_number?: string;
  notes?: string;
};

export function useAddCaseParty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AddPartyPayload) =>
      apiPost<CasePartySummary>(`/api/v1/cases/${payload.casePublicId}/parties`, {
        name: payload.name,
        type: payload.type,
        side: payload.side,
        role: payload.role,
        is_client: payload.is_client,
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
      toast({
        title: "Party added",
        description: "The party was added to the case.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Add failed",
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
      toast({
        title: "Party updated",
        description: "Party details were saved.",
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

type RemovePartyPayload = {
  casePublicId: string;
  partyId: number;
};

export function useRemoveCaseParty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ casePublicId, partyId }: RemovePartyPayload) =>
      apiDelete(`/api/v1/cases/${casePublicId}/parties/${partyId}`),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.casePublicId, "parties"],
      });
      toast({
        title: "Party removed",
        description: "The party was removed from the case.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Remove failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}
