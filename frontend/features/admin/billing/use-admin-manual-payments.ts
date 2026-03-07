import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { ManualPaymentMethod, ManualPaymentRequest, ManualSubscriptionChangeRequest } from "@/features/billing/types";

type ApiResponse<T> = { data: T };

export function useAdminManualPayments(filters?: {
  status?: "pending" | "approved" | "rejected" | "expired" | "";
  tenant?: string;
  date_from?: string;
  date_to?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.tenant) params.set("tenant", filters.tenant);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  const query = params.toString();

  return useQuery({
    queryKey: ["admin", "manual-payments", filters],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<ManualPaymentRequest[]>>(
        `/api/v1/admin/manual-payments${query ? `?${query}` : ""}`
      );
      return response.data;
    },
  });
}

export function useApproveManualPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicId: string) => {
      const response = await apiPost<ApiResponse<ManualPaymentRequest>>(
        `/api/v1/admin/manual-payments/${publicId}/approve`,
        {}
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payments"] });
    },
  });
}

export function useRejectManualPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { publicId: string; reason?: string }) => {
      const response = await apiPost<ApiResponse<ManualPaymentRequest>>(
        `/api/v1/admin/manual-payments/${payload.publicId}/reject`,
        { reason: payload.reason ?? null }
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payments"] });
    },
  });
}

export function useAdminManualMethods() {
  return useQuery({
    queryKey: ["admin", "manual-payment-methods"],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<ManualPaymentMethod[]>>(
        "/api/v1/admin/manual-payment-methods"
      );
      return response.data;
    },
  });
}

export function useCreateManualMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      channel: "bkash" | "rocket";
      account_name?: string | null;
      receiver_number: string;
      instructions_en?: string | null;
      instructions_bn?: string | null;
      active?: boolean;
      sort_order?: number;
    }) => {
      const response = await apiPost<ApiResponse<ManualPaymentMethod>>(
        "/api/v1/admin/manual-payment-methods",
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payment-methods"] });
    },
  });
}

export function useUpdateManualMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      public_id: string;
      channel?: "bkash" | "rocket";
      account_name?: string | null;
      receiver_number?: string;
      instructions_en?: string | null;
      instructions_bn?: string | null;
      active?: boolean;
      sort_order?: number;
    }) => {
      const response = await apiPut<ApiResponse<ManualPaymentMethod>>(
        `/api/v1/admin/manual-payment-methods/${payload.public_id}`,
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payment-methods"] });
    },
  });
}

export function useDeleteManualMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/admin/manual-payment-methods/${publicId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payment-methods"] });
    },
  });
}

export function useAdminManualSubscriptionChanges(filters?: {
  status?: "pending" | "approved" | "rejected" | "applied" | "";
  tenant?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.tenant) params.set("tenant", filters.tenant);
  const query = params.toString();

  return useQuery({
    queryKey: ["admin", "manual-subscription-changes", filters],
    queryFn: async () => {
      const response = await apiGet<ApiResponse<ManualSubscriptionChangeRequest[]>>(
        `/api/v1/admin/manual-subscription-changes${query ? `?${query}` : ""}`
      );
      return response.data;
    },
  });
}

export function useApproveManualSubscriptionChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { publicId: string; effective_at?: string }) => {
      const response = await apiPost<ApiResponse<ManualSubscriptionChangeRequest>>(
        `/api/v1/admin/manual-subscription-changes/${payload.publicId}/approve`,
        { effective_at: payload.effective_at ?? null }
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-subscription-changes"] });
    },
  });
}

export function useRejectManualSubscriptionChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { publicId: string; reason?: string }) => {
      const response = await apiPost<ApiResponse<ManualSubscriptionChangeRequest>>(
        `/api/v1/admin/manual-subscription-changes/${payload.publicId}/reject`,
        { reason: payload.reason ?? null }
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-subscription-changes"] });
    },
  });
}
