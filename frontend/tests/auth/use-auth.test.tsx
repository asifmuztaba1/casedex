import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth, useLogin, useLogout } from "@/features/auth/use-auth";
import { createWrapper, mockApi, tenantUser } from "../utils";

function stubOfflineCaches() {
  const deleted: string[] = [];
  vi.stubGlobal("caches", {
    keys: async () => ["casedex-data-v3", "casedex-pages-v3", "unrelated-cache"],
    delete: async (key: string) => {
      deleted.push(key);
      return true;
    },
  });
  return deleted;
}

describe("auth hooks", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=csrf%3Dtoken; path=/";
  });

  it("treats a 401 from /auth/me as signed out", async () => {
    mockApi({ "/api/v1/auth/me": { status: 401, body: { message: "Unauthenticated." } } });
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("logs in with a CSRF cookie, stores the user and clears the previous user's offline data", async () => {
    const { calls } = mockApi({
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/login": { status: 200, body: { data: tenantUser } },
      "/api/v1/auth/me": { status: 200, body: { data: tenantUser } },
    });
    const deleted = stubOfflineCaches();
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync({ email: tenantUser.email, password: "secret-pass" }));

    expect(calls.map((c) => c.path).slice(0, 2)).toEqual(["/sanctum/csrf-cookie", "/api/v1/auth/login"]);
    const login = calls[1].init!;
    expect(login.method).toBe("POST");
    expect(login.credentials).toBe("include");
    expect(JSON.parse(login.body as string)).toEqual({ email: tenantUser.email, password: "secret-pass" });
    expect((login.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("csrf=token");
    expect(queryClient.getQueryData(["auth-me"])).toEqual(tenantUser);
    expect(deleted.sort()).toEqual(["casedex-data-v3", "casedex-pages-v3"]);
  });

  it("surfaces the server's message when credentials are wrong", async () => {
    mockApi({
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/login": { status: 422, body: { message: "These credentials do not match our records." } },
    });
    const deleted = stubOfflineCaches();
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });
    await expect(
      act(() => result.current.mutateAsync({ email: tenantUser.email, password: "wrong" }))
    ).rejects.toThrow("These credentials do not match our records.");

    expect(queryClient.getQueryData(["auth-me"])).toBeUndefined();
    expect(deleted).toEqual([]);
  });

  it("logs out, forgets the user and clears their offline data", async () => {
    const { calls } = mockApi({
      "/sanctum/csrf-cookie": { status: 204 },
      "/api/v1/auth/logout": { status: 204 },
      "/api/v1/auth/me": { status: 401 },
    });
    const deleted = stubOfflineCaches();
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["auth-me"], tenantUser);

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync());

    expect(calls.map((c) => c.path)).toContain("/api/v1/auth/logout");
    expect(queryClient.getQueryData(["auth-me"])).toBeNull();
    expect(deleted.sort()).toEqual(["casedex-data-v3", "casedex-pages-v3"]);
  });
});
