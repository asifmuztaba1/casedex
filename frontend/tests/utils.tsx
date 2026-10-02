import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { LocaleProvider } from "@/components/locale-provider";

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LocaleProvider initialLocale="en">{children}</LocaleProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, Wrapper };
}

type MockRoute = { status: number; body?: unknown };

/**
 * Stubs fetch with one canned response per API path and records every call.
 * Keys are a path ("/api/v1/x") or a method and path ("DELETE /api/v1/x").
 */
export function mockApi(routes: Record<string, MockRoute>) {
  const calls: { path: string; method: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input, "http://localhost").pathname;
    const method = (init?.method ?? "GET").toUpperCase();
    calls.push({ path, method, init });
    const route = routes[`${method} ${path}`] ?? routes[path];
    if (!route) {
      throw new Error(`Unexpected request to ${path}`);
    }
    const text = route.body === undefined ? "" : JSON.stringify(route.body);
    return new Response(route.status === 204 ? null : text, { status: route.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls };
}

export const tenantUser = {
  public_id: "01USERPUBLICID",
  name: "Rahim Uddin",
  email: "rahim@example.test",
  tenant_public_id: "01TENANTPUBLICID",
  country_id: 1,
  role: "admin" as const,
  tenant: { name: "Rahim Chambers", has_workspace_access: true },
};
