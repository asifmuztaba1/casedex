import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateResearchNotePayload) =>
      apiPost<ResearchNoteSummary>("/api/v1/research-notes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
      toast({
        title: "Research note saved",
        description: "The note has been created.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useDeleteResearchNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/research-notes/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
      toast({
        title: "Research note removed",
        description: "The note has been deleted.",
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

type UpdateResearchNotePayload = {
  publicId: string;
  data: Partial<CreateResearchNotePayload>;
};

export function useUpdateResearchNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateResearchNotePayload) =>
      apiPut<ResearchNoteSummary>(`/api/v1/research-notes/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-notes"] });
      toast({
        title: "Research note updated",
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
