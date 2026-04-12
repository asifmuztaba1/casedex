"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPlanPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/workspace");
  }, [router]);
  return null;
}
