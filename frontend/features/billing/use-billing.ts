import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type {
  BillingInterval,
  BillingInvoice,
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
