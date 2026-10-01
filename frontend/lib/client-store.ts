"use client";

import { useSyncExternalStore } from "react";

const LOCAL_CHANGE_EVENT = "casedex:local-storage";

function noopSubscribe() {
  return () => {};
}

/** True after hydration on the client, false during SSR and the hydration pass. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCAL_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCAL_CHANGE_EVENT, callback);
  };
}

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reads a localStorage value and re-renders when it changes, in this tab
 * (via writeLocalStorage) or another tab. `serverValue` is used during SSR
 * and hydration so server and client markup match.
 */
export function useLocalStorageValue(
  key: string,
  serverValue: string | null = null
): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    () => readLocalStorage(key),
    () => serverValue
  );
}

/** Writes a localStorage value and notifies useLocalStorageValue subscribers. */
export function writeLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode, blocked site data).
  }
  window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
}
