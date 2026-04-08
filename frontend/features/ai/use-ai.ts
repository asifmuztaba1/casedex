import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

type ApiResponse<T> = { data: T };

export type AiRequest = {
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

function aiMutation<P extends Record<string, unknown>>(endpoint: string) {
  return () =>
    useMutation({
      mutationFn: async (payload: P & { idempotency_key?: string }) => {
        const response = await apiPost<ApiResponse<AiRequest>>(endpoint, {
          ...payload,
          idempotency_key: payload.idempotency_key ?? randomIdempotencyKey(),
        });
        return response.data;
      },
    });
}

export const useAiHearingSummary = aiMutation<{ content: string }>("/api/v1/ai/hearing-summary");
export const useAiDiarySummary = aiMutation<{ content: string }>("/api/v1/ai/diary-summary");
export const useAiResearchSummary = aiMutation<{ content: string }>("/api/v1/ai/research-summary");
export const useAiDocumentQa = aiMutation<{ question: string; context: string }>("/api/v1/ai/document-qa");

export const useAiPetitionDraft = aiMutation<{
  case_type: string;
  court_name: string;
  facts: string;
  relief_sought?: string;
  sections?: string;
  client_name?: string;
  opponent_name?: string;
  language?: string;
}>("/api/v1/ai/petition-draft");

export const useAiLegalSections = aiMutation<{
  content: string;
  language?: string;
}>("/api/v1/ai/legal-sections");

export const useAiCaseLaw = aiMutation<{
  content: string;
  language?: string;
}>("/api/v1/ai/case-law");

export const useAiNextSteps = aiMutation<{
  case_title?: string;
  case_status?: string;
  content: string;
  language?: string;
}>("/api/v1/ai/next-steps");

export const useAiClientComms = aiMutation<{
  case_title?: string;
  content: string;
  client_name?: string;
  tone?: string;
  language?: string;
}>("/api/v1/ai/client-communication");

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
