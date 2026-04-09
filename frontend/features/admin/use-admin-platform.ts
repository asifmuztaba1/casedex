import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

export type PlatformAnalytics = {
  total_tenants: number;
  total_users: number;
  total_cases: number;
  tenants_by_plan: Record<string, number>;
  on_trial: number;
  trial_expired: number;
  pending_payments: number;
  open_tickets: number;
  queue: {
    pending_jobs: number | null;
    failed_jobs: number;
  };
  recent_tenants: {
    public_id: string;
    name: string;
    plan: string | null;
    users_count: number;
    country: string | null;
    created_at: string;
  }[];
  recent_users: {
    public_id: string;
    name: string;
    email: string;
    role: string;
    tenant_name: string | null;
    country: string | null;
    created_at: string;
  }[];
};

export type AdminTenant = {
  public_id: string;
  name: string;
  plan: string | null;
  trial_ends_at: string | null;
  users_count: number;
  country: string | null;
  locale: string | null;
  created_at: string;
};

export type AdminUser = {
  public_id: string;
  name: string;
  email: string;
  role: string;
  tenant_name: string | null;
  tenant_public_id: string | null;
  country: string | null;
  whatsapp_opted_in: boolean;
  email_verified_at: string | null;
  created_at: string;
};

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiGet<PlatformAnalytics>("/api/v1/admin/analytics"),
  });
}

export function useAdminTenants(filters?: { search?: string; plan?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.plan) params.set("plan", filters.plan);
  const query = params.toString();

  return useQuery({
    queryKey: ["admin", "tenants", filters],
    queryFn: async () => {
      const res = await apiGet<{ data: AdminTenant[]; next_cursor: string | null }>(
        `/api/v1/admin/tenants${query ? `?${query}` : ""}`
      );
      return res;
    },
  });
}

export function useAdminUsers(filters?: { search?: string; role?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.role) params.set("role", filters.role);
  const query = params.toString();

  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: async () => {
      const res = await apiGet<{ data: AdminUser[]; next_cursor: string | null }>(
        `/api/v1/admin/users${query ? `?${query}` : ""}`
      );
      return res;
    },
  });
}

export type AiPayment = {
  public_id: string;
  tenant_public_id: string | null;
  tenant_name: string | null;
  user_public_id: string | null;
  user_name: string | null;
  pack: { public_id: string; code: string; name: string; credits: number } | null;
  amount: number;
  currency: string;
  sender_number: string | null;
  transaction_id: string | null;
  sent_at: string | null;
  status: string | null;
  reviewed_by_public_id: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  screenshot_download_url: string | null;
};

export function useAdminAiPayments(filters?: { status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("tenant_public_id", filters.search);
  const query = params.toString();

  return useQuery({
    queryKey: ["admin", "ai-payments", filters],
    queryFn: async () => {
      const res = await apiGet<{ data: AiPayment[]; meta: { total: number } }>(
        `/api/v1/admin/ai-manual-payments${query ? `?${query}` : ""}`
      );
      return res;
    },
  });
}

export function useApproveAiPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ publicId }: { publicId: string }) => {
      return apiPost(`/api/v1/admin/ai-manual-payments/${publicId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ai-payments"] });
      toast({ title: "AI payment approved", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "error" });
    },
  });
}

export function useRejectAiPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ publicId, reason }: { publicId: string; reason?: string }) => {
      return apiPost(`/api/v1/admin/ai-manual-payments/${publicId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ai-payments"] });
      toast({ title: "AI payment rejected", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to reject", variant: "error" });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ publicId, role }: { publicId: string; role: string }) => {
      return apiPost<{ data: { public_id: string; name: string; role: string } }>(
        `/api/v1/admin/users/${publicId}/role`,
        { role, _method: "PATCH" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
      toast({ title: "Role updated", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "error" });
    },
  });
}
