"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TOUR_STEPS } from "@/lib/tour-steps";

const STORAGE_KEY = "casedex_tour_completed";

type TourContextValue = {
  isActive: boolean;
  currentStep: number;
  hasCompleted: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
};

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Default to true to prevent flash on first render
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHasCompleted(stored === "true");
  }, []);

  const markComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setHasCompleted(true);
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= TOUR_STEPS.length - 1) {
        setIsActive(false);
        markComplete();
        return 0;
      }
      return prev + 1;
    });
  }, [markComplete]);

  const prev = useCallback(() => {
    setCurrentStep((p) => Math.max(0, p - 1));
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    markComplete();
    setCurrentStep(0);
  }, [markComplete]);

  const complete = useCallback(() => {
    setIsActive(false);
    markComplete();
    setCurrentStep(0);
  }, [markComplete]);

  return (
    <TourContext.Provider
      value={{ isActive, currentStep, hasCompleted, start, next, prev, skip, complete }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useProductTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useProductTour must be used within TourProvider");
  }
  return ctx;
}
