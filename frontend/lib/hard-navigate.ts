/**
 * Full page load on purpose: resets client caches and service worker state,
 * e.g. when a new session starts.
 */
export function hardNavigate(url: string): void {
  window.location.href = url;
}
