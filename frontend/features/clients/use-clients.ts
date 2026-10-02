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

export type ContactSummary = {
  public_id: string;
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

export function useClientDetail(publicId: string) {
  return useQuery({
    queryKey: ["clients", publicId],
    queryFn: () =>
      apiGet<ContactDetailResponse>(`/api/v1/clients/${publicId}`),
    enabled: Boolean(publicId),
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
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) =>
      apiPost<ContactSummary>("/api/v1/clients", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: t("toast.contact_saved"),
        description: t("toast.contact_saved_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.contact_not_saved"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateClientPayload = {
  publicId: string;
  data: Partial<CreateClientPayload>;
};

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateClientPayload) =>
      apiPut<ContactSummary>(`/api/v1/clients/${publicId}`, data),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", payload.publicId] });
      toast({
        title: t("toast.contact_updated"),
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

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/clients/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: t("toast.contact_removed"),
        description: t("toast.contact_removed_desc"),
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

export function useSearchContacts(query: string) {
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () =>
      apiGet<ContactListResponse>(`/api/v1/clients/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
