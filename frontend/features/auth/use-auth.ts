import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { getStoredLocale } from "@/lib/locale";
import { apiFetch } from "@/lib/api-client";
import { clearOfflineUserData } from "@/pwa/offline-cache";
import { useLocale } from "@/components/locale-provider";
import { translate } from "@/lib/i18n";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return translate(getStoredLocale(), "common.something_wrong");
}

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

function buildHeaders(extra?: Record<string, string>) {
  return {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": getStoredLocale(),
    "X-Locale": getStoredLocale(),
    ...extra,
  };
}

export type AuthUser = {
  public_id: string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  tenant_public_id: string | null;
  tenant?: {
    name?: string | null;
    plan?: "trial" | "starter" | "professional" | "chambers" | null;
    has_active_subscription?: boolean;
    has_workspace_access?: boolean;
    billing_source?: "lemon" | "manual_mfs" | "none";
    manual_status?: "pending" | "approved" | "rejected" | "expired" | null;
    temporary_access_expires_at?: string | null;
    subscription_status?: string | null;
    on_trial?: boolean;
    trial_ends_at?: string | null;
    on_grace_period?: boolean;
    plan_limits?: {
      storage_limit_bytes?: number | null;
      storage_used_bytes?: number;
      storage_remaining_bytes?: number | null;
      has_unlimited_storage?: boolean;
      has_audit_export?: boolean;
      has_bulk_import?: boolean;
      has_client_portal?: boolean;
      has_sso?: boolean;
      has_priority_support?: boolean;
      support_tier?: "community" | "email" | "email_whatsapp";
      seat_limit?: number | null;
      cause_list_alert_limit?: number | null;
      monthly_ai_credits?: number;
    } | null;
  } | null;
  tenant_name?: string | null;
  country_id: number | null;
  country?: string | null;
  country_code?: string | null;
  role:
    | "platform_admin"
    | "platform_editor"
    | "admin"
    | "lawyer"
    | "associate"
    | "assistant"
    | "viewer";
  locale?: "en" | "bn";
  tenant_locale?: "en" | "bn" | null;
  whatsapp_phone?: string | null;
  whatsapp_opted_in?: boolean;
};

type AuthResponse = {
  data: AuthUser;
  meta?: { account_deletion_cancelled?: boolean };
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  country_id: number;
  locale?: "en" | "bn";
};

type LoginPayload = {
  email: string;
  password: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: AuthUser["role"];
  country_id: number;
  locale?: "en" | "bn";
};

type UpdateUserPayload = {
  public_id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
  country_id: number;
  password?: string;
  locale?: "en" | "bn";
};
type CreateTenantPayload = {
  tenant_name: string;
  country_id: number;
  plan: "starter" | "professional" | "chambers";
  locale?: "en" | "bn";
  skipToast?: boolean;
};

type UpdateProfilePayload = {
  name: string;
  email: string;
  country_id: number;
  password?: string;
  locale?: "en" | "bn";
  whatsapp_phone?: string | null;
  whatsapp_opted_in?: boolean;
};

function resolveSanctumBase(): string {
  if (!API_BASE_URL) {
    return "";
  }

  return API_BASE_URL.replace(/\/api(\/v\d+)?$/, "");
}

async function ensureCsrfCookie(): Promise<void> {
  const base = resolveSanctumBase();
  await apiFetch(`${base}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: buildHeaders(),
  });
}

function getXsrfToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function extractErrorMessage(payload: ApiErrorPayload): string | null {
  if (payload?.errors) {
    const firstError = Object.values(payload.errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0] ?? null;
    }
    return firstError ?? null;
  }
  return payload?.message ?? null;
}

async function throwForResponse(response: Response): Promise<never> {
  const text = await response.text();
  if (!text) {
    throw new Error(`Request failed: ${response.status}`);
  }

  try {
    const payload = JSON.parse(text) as ApiErrorPayload;
    const message = extractErrorMessage(payload);
    throw new Error(message || `Request failed: ${response.status}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Request failed: ${response.status}`);
  }
}

async function fetchMe(): Promise<AuthUser | null> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/auth/me`, {
    credentials: "include",
    headers: buildHeaders(),
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    await throwForResponse(response);
  }

  const payload = (await response.json()) as AuthResponse;
  return payload.data;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const xsrfToken = getXsrfToken();
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...buildHeaders({ "Content-Type": "application/json" }),
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const xsrfToken = getXsrfToken();
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      ...buildHeaders({ "Content-Type": "application/json" }),
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    staleTime: 1000 * 60,
  });
}

export function useLogin() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      await ensureCsrfCookie();
      const result = await postJson<AuthResponse>("/api/v1/auth/login", payload);
      await clearOfflineUserData();
      return result;
    },
    onSuccess: (response) => {
      client.setQueryData(["auth-me"], response.data);
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: t("toast.signed_in"),
        description: response.meta?.account_deletion_cancelled
          ? t("account_delete.cancelled_on_sign_in")
          : t("toast.welcome_back"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.sign_in_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useRegister() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await ensureCsrfCookie();
      const result = await postJson<AuthResponse>("/api/v1/auth/register", payload);
      await clearOfflineUserData();
      return result;
    },
    onSuccess: (response) => {
      client.setQueryData(["auth-me"], response.data);
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: t("toast.account_created"),
        description: t("toast.account_ready"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.registration_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useResendVerificationEmail() {
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return postJson<void>("/api/v1/auth/email/verification-notification", {});
    },
    onSuccess: () => {
      toast({
        title: t("toast.verification_sent"),
        description: t("toast.check_inbox_verify"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("billing.ui.request_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      await ensureCsrfCookie();
      return postJson<void>("/api/v1/auth/forgot-password", payload);
    },
    onSuccess: () => {
      toast({
        title: t("toast.email_sent"),
        description: t("toast.check_inbox_reset"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("billing.ui.request_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useResetPassword() {
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      await ensureCsrfCookie();
      return postJson<void>("/api/v1/auth/reset-password", payload);
    },
    onSuccess: () => {
      toast({
        title: t("toast.password_updated"),
        description: t("toast.sign_in_new_password"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.reset_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      await postJson<void>("/api/v1/auth/logout", {});
      await clearOfflineUserData();
    },
    onSuccess: () => {
      client.setQueryData(["auth-me"], null);
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: t("toast.signed_out"),
        description: t("toast.signed_out_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.sign_out_failed"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["tenant-users"],
    queryFn: async () => {
      const response = await apiFetch(`${API_BASE_URL}/api/v1/users`, {
        credentials: "include",
        headers: buildHeaders(),
      });

      if (!response.ok) {
        await throwForResponse(response);
      }

      const payload = (await response.json()) as { data: AuthUser[] };
      return payload.data;
    },
    enabled,
  });
}

export function useCreateUser() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      await ensureCsrfCookie();
      return postJson<AuthResponse>("/api/v1/users", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tenant-users"] });
      toast({
        title: t("toast.member_added"),
        description: t("toast.member_added_desc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("toast.user_not_created"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      await ensureCsrfCookie();
      return putJson<AuthResponse>(`/api/v1/users/${payload.public_id}`, payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tenant-users"] });
      toast({
        title: t("toast.member_updated"),
        description: t("cases.toast.updated_body"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("cases.toast.update_failed_title"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useCreateTenant() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: CreateTenantPayload) => {
      await ensureCsrfCookie();
      // skipToast is a client-only option; don't send it to the API.
      const requestPayload: Partial<CreateTenantPayload> = { ...payload };
      delete requestPayload.skipToast;
      return postJson<AuthResponse>("/api/v1/tenants", requestPayload);
    },
    onSuccess: (_response, variables) => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      if (!variables.skipToast) {
        toast({
          title: t("toast.firm_created"),
          description: t("toast.firm_ready"),
          variant: "success",
        });
      }
    },
    onError: (error, variables) => {
      if (!variables.skipToast) {
        toast({
          title: t("toast.firm_not_created"),
          description: getErrorMessage(error),
          variant: "error",
        });
      }
    },
  });
}

type UpdateTenantPayload = {
  name: string;
};

export function useUpdateTenant() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: UpdateTenantPayload) => {
      await ensureCsrfCookie();
      return putJson<AuthResponse>("/api/v1/tenants", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: t("toast.firm_updated"),
        description: t("toast.firm_name_updated"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("cases.toast.update_failed_title"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      await ensureCsrfCookie();
      return putJson<AuthResponse>("/api/v1/profile", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: t("toast.profile_updated"),
        description: t("cases.toast.updated_body"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("cases.toast.update_failed_title"),
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}
