/**
 * Sentry error monitoring configuration.
 *
 * To enable Sentry:
 * 1. Install: pnpm add @sentry/nextjs
 * 2. Create a Sentry project at https://sentry.io
 * 3. Set NEXT_PUBLIC_SENTRY_DSN in your environment
 *
 * This file provides a lightweight wrapper so the app works
 * without Sentry installed (dev/staging) and only loads it in production.
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sentry: any = null;

export async function initSentry() {
  if (!SENTRY_DSN || typeof window === "undefined") return;

  try {
    // Dynamic import — only resolves if @sentry/nextjs is installed
    _sentry = await (Function('return import("@sentry/nextjs")')() as Promise<any>);
    _sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.5,
    });
  } catch {
    // @sentry/nextjs not installed — silently skip
  }
}

export function captureException(error: unknown) {
  if (_sentry) {
    _sentry.captureException(error);
  } else {
    console.error("[CaseDex]", error);
  }
}

export function captureMessage(message: string) {
  if (_sentry) {
    _sentry.captureMessage(message);
  }
}
