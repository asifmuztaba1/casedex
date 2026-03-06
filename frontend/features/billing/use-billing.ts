import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPostForm } from "@/lib/api-client";
import type {
  AiLedgerEvent,
  AiManualPaymentRequest,
  AiWalletSummary,
  BillingInterval,
  BillingInvoice,
  ManualMethodsResponse,
  ManualPaymentRequest,
  PlanLimits,
  PlanTier,
  SubscriptionState,
} from "@/features/billing/types";

type ApiResponse<T> = { data: T };

export function useSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<SubscriptionState>>(
        "/api/v1/billing/subscription"
      );
      return response.data;
    },
  });
}

export function usePlanLimits() {
  return useQuery({
    queryKey: ["billing", "plan-limits"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<PlanLimits>>(
        "/api/v1/billing/plan-limits"
      );
      return response.data;
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: {
      plan: Exclude<PlanTier, "trial">;
      interval: BillingInterval;
      add_unlimited_storage?: boolean;
      redirect_url?: string;
    }) => {
      const response = await apiPost<ApiResponse<{ checkout_url: string }>>(
        "/api/v1/billing/checkout",
        payload
      );
      return response.data;
    },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      plan: Exclude<PlanTier, "trial">;
      interval: BillingInterval;
    }) => apiPost("/api/v1/billing/change-plan", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "plan-limits"] }),
        queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
      ]);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost("/api/v1/billing/cancel", {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] }),
        queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
      ]);
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost("/api/v1/billing/resume", {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] }),
        queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
      ]);
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiPost<ApiResponse<{ portal_url: string }>>(
        "/api/v1/billing/portal",
        {}
      );
      return response.data;
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<BillingInvoice[]>>(
        "/api/v1/billing/invoices"
      );
      return response.data;
    },
  });
}

export function useManualMethods(enabled = true) {
  return useQuery({
    queryKey: ["billing", "manual-methods"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<ManualMethodsResponse>>(
        "/api/v1/billing/manual-methods"
      );
      return response.data;
    },
    enabled,
  });
}

export function useManualRequestStatus() {
  return useQuery({
    queryKey: ["billing", "manual-request-status"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<ManualPaymentRequest | null>>(
        "/api/v1/billing/manual-request/status"
      );
      return response.data;
    },
  });
}

export function useSubmitManualRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      plan: Exclude<PlanTier, "trial">;
      interval: BillingInterval;
      amount: number;
      sender_number: string;
      transaction_id: string;
      sent_at: string;
      screenshot: File;
    }) => {
      const formData = new FormData();
      formData.append("plan", payload.plan);
      formData.append("interval", payload.interval);
      formData.append("amount", payload.amount.toString());
      formData.append("sender_number", payload.sender_number);
      formData.append("transaction_id", payload.transaction_id);
      formData.append("sent_at", payload.sent_at);
      formData.append("screenshot", payload.screenshot);

      const response = await apiPostForm<ApiResponse<ManualPaymentRequest>>(
        "/api/v1/billing/manual-request",
        formData
      );

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "manual-request-status"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] }),
        queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
      ]);
    },
  });
}

export function useAiCredits() {
  return useQuery({
    queryKey: ["billing", "ai-credits"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<AiWalletSummary>>("/api/v1/billing/ai-credits");
      return response.data;
    },
  });
}

export function useAiLedger() {
  return useQuery({
    queryKey: ["billing", "ai-ledger"],
    queryFn: async () => {
      const response = await apiGet<{ data: AiLedgerEvent[]; meta: Record<string, unknown> }>(
        "/api/v1/billing/ai-ledger"
      );
      return response.data;
    },
  });
}

export function useAiCreditCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { pack_public_id: string; redirect_url?: string }) => {
      const response = await apiPost<ApiResponse<{ checkout_url: string }>>(
        "/api/v1/billing/ai-credit-checkout",
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "ai-credits"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "ai-ledger"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] }),
      ]);
    },
  });
}

export function useSubmitAiMfsRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      pack_public_id: string;
      amount: number;
      sender_number: string;
      transaction_id: string;
      sent_at: string;
      screenshot: File;
    }) => {
      const formData = new FormData();
      formData.append("pack_public_id", payload.pack_public_id);
      formData.append("amount", payload.amount.toString());
      formData.append("sender_number", payload.sender_number);
      formData.append("transaction_id", payload.transaction_id);
      formData.append("sent_at", payload.sent_at);
      formData.append("screenshot", payload.screenshot);

      const response = await apiPostForm<ApiResponse<AiManualPaymentRequest>>(
        "/api/v1/billing/ai-mfs-request",
        formData
      );

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "ai-credits"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "ai-ledger"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "ai-manual-request-status"] }),
      ]);
    },
  });
}

export function useAiMfsRequestStatus() {
  return useQuery({
    queryKey: ["billing", "ai-manual-request-status"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<AiManualPaymentRequest | null>>(
        "/api/v1/billing/ai-mfs-request/status"
      );
      return response.data;
    },
  });
}

export function useAiAnalytics() {
  return useQuery({
    queryKey: ["billing", "ai-analytics"],
    queryFn: async () => {
      const response = await apiGet<
        ApiResponse<{
          timeline: unknown[];
          daily_aggregates: unknown[];
          feature_breakdown: unknown[];
          user_breakdown: unknown[];
        }>
      >("/api/v1/billing/ai-analytics");
      return response.data;
    },
  });
}

export function useStoreAiAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      threshold_credits: number;
      channel_in_app?: boolean;
      channel_email?: boolean;
      is_active?: boolean;
    }) => apiPost("/api/v1/billing/ai-alert-rules", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "ai-credits"] });
    },
  });
}
