"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/features/billing/use-billing";
import type { FeedbackTrigger as FeedbackTriggerType } from "@/features/feedback/use-feedback";
import FeedbackModal from "@/components/feedback-modal";

const TRIAL_DAYS = 30;
const TRIAL_DELAY_DAYS = 3;
const FIRST_CASE_DELAY_MS = 2000;
const FRESH_LOGIN_GRACE_MS = 10_000;

function isAlreadyHandled(trigger: FeedbackTriggerType): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.localStorage.getItem(`casedex_feedback_submitted_${trigger}`) === "true" ||
    window.localStorage.getItem(`casedex_feedback_dismissed_${trigger}`) === "true"
  );
}

/** Returns true if the user logged in less than FRESH_LOGIN_GRACE_MS ago. */
function isFreshLogin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const loginAt = sessionStorage.getItem("casedex_login_at");
    if (!loginAt) return false;
    return Date.now() - Number(loginAt) < FRESH_LOGIN_GRACE_MS;
  } catch {
    return false;
  }
}

export default function FeedbackTrigger() {
  const { data: subscription } = useSubscription();
  const [activeTrigger, setActiveTrigger] = useState<FeedbackTriggerType | null>(null);
  const [ready, setReady] = useState(false);

  // Gate: wait for the fresh-login grace period before evaluating triggers.
  useEffect(() => {
    if (isFreshLogin()) {
      const timer = setTimeout(() => setReady(true), FRESH_LOGIN_GRACE_MS);
      return () => clearTimeout(timer);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    // Trial reminder: show after 3+ days into trial
    if (subscription?.on_trial && subscription?.trial_ends_at) {
      if (!isAlreadyHandled("trial_reminder")) {
        const trialEnd = new Date(subscription.trial_ends_at).getTime();
        const trialStart = trialEnd - TRIAL_DAYS * 24 * 60 * 60 * 1000;
        const daysSinceStart = (Date.now() - trialStart) / (24 * 60 * 60 * 1000);

        if (daysSinceStart >= TRIAL_DELAY_DAYS) {
          setActiveTrigger("trial_reminder");
          return;
        }
      }
    }

    // First case: show after first case creation with a short delay
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("casedex_first_case_created") === "true" &&
      !isAlreadyHandled("first_case")
    ) {
      const timer = setTimeout(() => {
        setActiveTrigger("first_case");
      }, FIRST_CASE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [ready, subscription]);

  if (!activeTrigger) return null;

  return (
    <FeedbackModal
      open
      onOpenChange={(open) => {
        if (!open) setActiveTrigger(null);
      }}
      trigger={activeTrigger}
    />
  );
}
