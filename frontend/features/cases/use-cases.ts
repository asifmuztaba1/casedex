import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export type ClientSummary = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  identity_number: string | null;
  notes: string | null;
};

export type UserSummary = {
  public_id: string;
  name: string;
  email: string;
  role: string | null;
};

export type CaseParticipantSummary = {
  id: number;
  role: string | null;
  user: UserSummary | null;
};

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

export type HearingSummary = {
  public_id: string;
  case_id: number;
  case_public_id?: string | null;
  hearing_at: string | null;
  type: string | null;
  agenda: string | null;
  location: string | null;
  outcome: string | null;
  minutes: string | null;
  next_steps: string | null;
};

export type DiaryEntrySummary = {
  public_id: string;
  case_id: number;
  case_public_id?: string | null;
  hearing_id: number | null;
  entry_at: string | null;
  title: string | null;
  body: string | null;
};

export type DocumentSummary = {
  public_id: string;
  case_id: number;
  case_public_id?: string | null;
  hearing_id: number | null;
  category: string | null;
  original_name: string | null;
  mime: string | null;
  size: number | null;
  download_url: string | null;
  created_at: string;
};

export type CaseSummary = {
  public_id: string;
  title: string;
  court: string | null;
  court_public_id?: string | null;
  case_number: string | null;
  status: string | null;
  client: ClientSummary | null;
  created_at: string;
};

export type CaseDetail = CaseSummary & {
  story: string | null;
  petition_draft: string | null;
  participants: CaseParticipantSummary[];
  parties: CasePartySummary[];
  upcoming_hearings: HearingSummary[];
  recent_diary_entries: DiaryEntrySummary[];
  recent_documents: DocumentSummary[];
};

type CaseListResponse = {
  data: CaseSummary[];
};

type CaseDetailResponse = {
  data: CaseDetail;
};

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<CaseListResponse>("/api/v1/cases"),
  });
}

export function useCaseDetail(publicId: string) {
  return useQuery({
    queryKey: ["cases", publicId],
    queryFn: async () => {
      const payload = await apiGet<CaseDetailResponse>(
        `/api/v1/cases/${publicId}`
      );
      return payload.data;
    },
    enabled: Boolean(publicId),
  });
}

type CreateCasePayload = {
  title: string;
  court: string;
  court_public_id?: string;
  case_number?: string;
  status?: string;
  story: string;
  petition_draft: string;
  client_id?: number;
  client?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    identity_number?: string;
    notes?: string;
  };
  client_party_role?: string;
  client_party_type?: string;
  parties?: Array<{
    name: string;
    type: string;
    side: string;
    role?: string;
    phone?: string;
    email?: string;
    address?: string;
    identity_number?: string;
    notes?: string;
  }>;
  participants?: Array<{
    user_public_id: string;
    role: string;
  }>;
  first_hearing?: {
    hearing_at: string;
    type: string;
    agenda?: string;
    location?: string;
  };
};

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: CreateCasePayload) =>
      apiPost<CaseSummary>("/api/v1/cases", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({
        title: t("cases.toast.created_title"),
        description: t("cases.toast.created_body"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("cases.toast.create_failed_title"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateCasePayload = {
  publicId: string;
  data: Partial<CreateCasePayload>;
};

export function useUpdateCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateCasePayload) =>
      apiPut<CaseSummary>(`/api/v1/cases/${publicId}`, data),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", payload.publicId] });
      toast({
        title: t("cases.toast.updated_title"),
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

export function useDeleteCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/cases/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({
        title: t("cases.toast.deleted_title"),
        description: t("cases.toast.deleted_body"),
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
