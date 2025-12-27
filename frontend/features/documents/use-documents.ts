import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPostForm, apiPutForm } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export type DocumentSummary = {
  public_id: string;
  case_id: number;
  case_public_id?: string | null;
  case_title?: string | null;
  hearing_id: number | null;
  category: string | null;
  original_name: string | null;
  mime: string | null;
  size: number | null;
  download_url: string | null;
  created_at: string;
};

type DocumentListResponse = {
  data: DocumentSummary[];
};

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: () => apiGet<DocumentListResponse>("/api/v1/documents"),
  });
}

export function useCaseDocuments(casePublicId: string) {
  return useQuery({
    queryKey: ["cases", casePublicId, "documents"],
    queryFn: () =>
      apiGet<DocumentListResponse>(`/api/v1/cases/${casePublicId}/documents`),
    enabled: Boolean(casePublicId),
  });
}

type CreateDocumentPayload = {
  case_public_id: string;
  category: string;
  file: File;
  hearing_public_id?: string;
};

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) => {
      const formData = new FormData();
      formData.append("case_public_id", payload.case_public_id);
      formData.append("category", payload.category);
      formData.append("file", payload.file);
      if (payload.hearing_public_id) {
        formData.append("hearing_public_id", payload.hearing_public_id);
      }
      return apiPostForm<DocumentSummary>("/api/v1/documents", formData);
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({
        queryKey: ["cases", payload.case_public_id, "documents"],
      });
      toast({
        title: "Document uploaded",
        description: "The document is now stored in the case.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateDocumentPayload = {
  publicId: string;
  data: {
    case_public_id?: string;
    category?: string;
    file?: File;
    hearing_public_id?: string;
  };
};

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateDocumentPayload) => {
      const formData = new FormData();
      if (data.case_public_id) {
        formData.append("case_public_id", data.case_public_id);
      }
      if (data.category) {
        formData.append("category", data.category);
      }
      if (data.file) {
        formData.append("file", data.file);
      }
      if (data.hearing_public_id) {
        formData.append("hearing_public_id", data.hearing_public_id);
      }
      return apiPutForm<DocumentSummary>(`/api/v1/documents/${publicId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document updated",
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

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/documents/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document removed",
        description: "The document was deleted.",
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
