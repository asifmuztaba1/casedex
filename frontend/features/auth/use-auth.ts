import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { getStoredLocale } from "@/lib/locale";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
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
  id: number;
  public_id: string;
  name: string;
  email: string;
  tenant_id: number | null;
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
};

type AuthResponse = {
  data: AuthUser;
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
  locale?: "en" | "bn";
};

type UpdateProfilePayload = {
  name: string;
  email: string;
  country_id: number;
  password?: string;
  locale?: "en" | "bn";
};

function resolveSanctumBase(): string {
  if (!API_BASE_URL) {
    return "";
  }

  return API_BASE_URL.replace(/\/api(\/v\d+)?$/, "");
}

async function ensureCsrfCookie(): Promise<void> {
  const base = resolveSanctumBase();
  const response = await fetch(`${base}/api/sanctum/csrf-cookie`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      await ensureCsrfCookie();
      return postJson<AuthResponse>("/api/v1/auth/login", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Signed in",
        description: "Welcome back.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Sign in failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useRegister() {
  const client = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await ensureCsrfCookie();
      return postJson<AuthResponse>("/api/v1/auth/register", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Account created",
        description: "Your account is ready.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      await ensureCsrfCookie();
      return postJson<void>("/api/v1/auth/forgot-password", payload);
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Check your inbox for the reset link.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Request failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useResetPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      await ensureCsrfCookie();
      return postJson<void>("/api/v1/auth/reset-password", payload);
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "You can sign in with the new password.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return postJson<void>("/api/v1/auth/logout", {});
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Signed out",
        description: "You have been signed out.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Sign out failed",
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
      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
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

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      await ensureCsrfCookie();
      return postJson<AuthResponse>("/api/v1/users", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tenant-users"] });
      toast({
        title: "Team member added",
        description: "The user has been added.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "User not created",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      await ensureCsrfCookie();
      return putJson<AuthResponse>(`/api/v1/users/${payload.public_id}`, payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tenant-users"] });
      toast({
        title: "Team member updated",
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

export function useCreateTenant() {
  const client = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateTenantPayload) => {
      await ensureCsrfCookie();
      return postJson<AuthResponse>("/api/v1/tenants", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Firm created",
        description: "Your firm workspace is ready.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Firm not created",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      await ensureCsrfCookie();
      return putJson<AuthResponse>("/api/v1/profile", payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Profile updated",
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
