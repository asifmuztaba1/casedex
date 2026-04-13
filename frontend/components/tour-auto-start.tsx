"use client";

import { useEffect } from "react";
import { useProductTour } from "@/components/tour-provider";

/**
 * Auto-starts the product tour after a delay, but only if the
 * user hasn't completed it yet. Renders nothing.
 */
export default function TourAutoStart({ delayMs = 0 }: { delayMs?: number }) {
  const { hasCompleted, start } = useProductTour();

  useEffect(() => {
    if (hasCompleted) return;
    const timer = setTimeout(() => start(), delayMs);
    return () => clearTimeout(timer);
  }, [hasCompleted, start, delayMs]);

  return null;
}
