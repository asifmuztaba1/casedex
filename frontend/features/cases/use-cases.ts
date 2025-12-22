import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

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
  case_number: string | null;
  status: string | null;
  client: ClientSummary | null;
  created_at: string;
};

export type CaseDetail = CaseSummary & {
  story: string | null;
  petition_draft: string | null;
  participants: CaseParticipantSummary[];
  upcoming_hearings: HearingSummary[];
  recent_diary_entries: DiaryEntrySummary[];
  recent_documents: DocumentSummary[];
};

type CaseListResponse = {
  data: CaseSummary[];
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
    queryFn: () => apiGet<CaseDetail>(`/api/v1/cases/${publicId}`),
    enabled: Boolean(publicId),
  });
}

type CreateCasePayload = {
  title: string;
  court: string;
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

  return useMutation({
    mutationFn: (payload: CreateCasePayload) =>
      apiPost<CaseSummary>("/api/v1/cases", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

type UpdateCasePayload = {
  publicId: string;
  data: Partial<CreateCasePayload>;
};

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateCasePayload) =>
      apiPut<CaseSummary>(`/api/v1/cases/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/cases/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}
