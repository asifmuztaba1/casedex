import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export type ContactSummary = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  identity_number: string | null;
  notes: string | null;
  type: "person" | "organization";
  is_client: boolean;
  case_parties_count: number;
  created_at: string;
};

export type ContactCaseHistoryItem = {
  case_public_id: string;
  title: string;
  case_number: string | null;
  status: string;
  party_side: string | null;
  party_role: string | null;
  party_type: string | null;
};

export type ContactDetail = ContactSummary & {
  case_history: ContactCaseHistoryItem[];
};

type ContactListResponse = {
  data: ContactSummary[];
};

type ContactDetailResponse = {
  data: ContactDetail;
};

export function useClients(params?: {
  search?: string;
  is_client?: string;
  type?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.is_client) qs.set("is_client", params.is_client);
  if (params?.type) qs.set("type", params.type);
  const query = qs.toString();

  return useQuery({
    queryKey: ["clients", params],
    queryFn: () =>
      apiGet<ContactListResponse>(
        `/api/v1/clients${query ? `?${query}` : ""}`
      ),
  });
}

export function useClientDetail(id: number) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () =>
      apiGet<ContactDetailResponse>(`/api/v1/clients/${id}`),
    enabled: Boolean(id),
  });
}

type CreateClientPayload = {
  name: string;
  type: string;
  is_client?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  identity_number?: string;
  notes?: string;
};

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) =>
      apiPost<ContactSummary>("/api/v1/clients", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Contact saved",
        description: "The contact was created successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Contact not saved",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateClientPayload = {
  id: number;
  data: Partial<CreateClientPayload>;
};

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: UpdateClientPayload) =>
      apiPut<ContactSummary>(`/api/v1/clients/${id}`, data),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", payload.id] });
      toast({
        title: "Contact updated",
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

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/v1/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Contact removed",
        description: "The contact was deleted.",
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

export function useSearchContacts(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () =>
      apiGet<ContactListResponse>(`/api/v1/clients/search?q=${query}`),
    enabled: query.length >= 2,
  });
}
