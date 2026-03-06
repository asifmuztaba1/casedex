import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

type ApiResponse<T> = { data: T };

type AiRequest = {
  public_id: string;
  feature: string;
  status: "queued" | "running" | "completed" | "failed" | "blocked_insufficient_credits";
  credits_cost: number;
  result_text: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

function randomIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAiHearingSummary() {
  return useMutation({
    mutationFn: async (payload: { content: string; idempotency_key?: string }) => {
      const response = await apiPost<ApiResponse<AiRequest>>("/api/v1/ai/hearing-summary", {
        content: payload.content,
        idempotency_key: payload.idempotency_key ?? randomIdempotencyKey(),
      });
      return response.data;
    },
  });
}

export function useAiDiarySummary() {
  return useMutation({
    mutationFn: async (payload: { content: string; idempotency_key?: string }) => {
      const response = await apiPost<ApiResponse<AiRequest>>("/api/v1/ai/diary-summary", {
        content: payload.content,
        idempotency_key: payload.idempotency_key ?? randomIdempotencyKey(),
      });
      return response.data;
    },
  });
}

export function useAiResearchSummary() {
  return useMutation({
    mutationFn: async (payload: { content: string; idempotency_key?: string }) => {
      const response = await apiPost<ApiResponse<AiRequest>>("/api/v1/ai/research-summary", {
        content: payload.content,
        idempotency_key: payload.idempotency_key ?? randomIdempotencyKey(),
      });
      return response.data;
    },
  });
}

export function useAiDocumentQa() {
  return useMutation({
    mutationFn: async (payload: { question: string; context: string; idempotency_key?: string }) => {
      const response = await apiPost<ApiResponse<AiRequest>>("/api/v1/ai/document-qa", {
        question: payload.question,
        context: payload.context,
        idempotency_key: payload.idempotency_key ?? randomIdempotencyKey(),
      });
      return response.data;
    },
  });
}

export function useAiRequestStatus(publicId: string | null) {
  return useQuery({
    queryKey: ["ai", "request", publicId],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<AiRequest>>(`/api/v1/ai/requests/${publicId}`);
      return response.data;
    },
    enabled: Boolean(publicId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 2000 : false;
    },
  });
}
