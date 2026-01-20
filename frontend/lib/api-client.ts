import { getStoredLocale } from "@/lib/locale";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

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

function withXsrf(headers: HeadersInit = {}): HeadersInit {
  const xsrfToken = getXsrfToken();
  const locale = getStoredLocale();
  if (!xsrfToken) {
    return {
      ...headers,
      "Accept-Language": locale,
      "X-Locale": locale,
    };
  }

  return {
    ...headers,
    "X-XSRF-TOKEN": xsrfToken,
    "Accept-Language": locale,
    "X-Locale": locale,
  };
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

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": getStoredLocale(),
      "X-Locale": getStoredLocale(),
    },
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: withXsrf({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  return response.json() as Promise<T>;
}

export async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: withXsrf({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: withXsrf(),
  });

  if (!response.ok) {
    await throwForResponse(response);
  }
}

export async function apiPostForm<T>(
  path: string,
  payload: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: withXsrf(),
    body: payload,
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  return response.json() as Promise<T>;
}

export async function apiPutForm<T>(
  path: string,
  payload: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: withXsrf(),
    body: payload,
  });

  if (!response.ok) {
    await throwForResponse(response);
  }

  return response.json() as Promise<T>;
}
