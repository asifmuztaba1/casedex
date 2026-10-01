/**
 * The service worker caches API responses and visited pages so CaseDex stays
 * readable offline. Those caches hold one user's case data, so drop them
 * whenever the signed-in user changes (login, registration, logout).
 */
export async function clearOfflineUserData(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("casedex-data-") || key.startsWith("casedex-pages-"))
        .map((key) => caches.delete(key))
    );
  } catch {
    // Cache storage can be unavailable (private mode); nothing to clear then.
  }
}
