import type { BillingInterval } from "@/features/billing/types";
import type { PlanId } from "@/features/billing/plan-catalog";

export type OnboardingPaymentSource = "lemon" | "manual_mfs";

export type OnboardingDraft = {
  plan?: PlanId;
  interval?: BillingInterval;
  payment_source?: OnboardingPaymentSource;
};

const PREFIX = "casedex:onboarding:";

function key(email: string): string {
  return `${PREFIX}${email.toLowerCase()}`;
}

export function loadOnboardingDraft(email: string): OnboardingDraft {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(key(email));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as OnboardingDraft;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function saveOnboardingDraft(email: string, draft: OnboardingDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key(email), JSON.stringify(draft));
}

export function clearOnboardingDraft(email: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key(email));
}
