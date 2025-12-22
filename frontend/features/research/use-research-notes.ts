import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";

export type ResearchNoteSummary = {
  public_id: string;
  title: string;
  body: string | null;
  created_at: string;
};

type ResearchNoteListResponse = {
  data: ResearchNoteSummary[];
};

export function useResearchNotes() {
  return useQuery({
    queryKey: ["research-notes"],
    queryFn: () => apiGet<ResearchNoteListResponse>("/api/v1/research-notes"),
  });
}

type CreateResearchNotePayload = {
  title: string;
  body?: string;
};

export function useCreateResearchNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateResearchNotePayload) =>
      apiPost<ResearchNoteSummary>("/api/v1/research-notes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
    },
  });
}

export function useDeleteResearchNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/research-notes/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
    },
  });
}

type UpdateResearchNotePayload = {
  publicId: string;
  data: Partial<CreateResearchNotePayload>;
};

export function useUpdateResearchNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateResearchNotePayload) =>
      apiPut<ResearchNoteSummary>(`/api/v1/research-notes/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
    },
  });
}
