"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useProductTour } from "@/components/tour-provider";
import { TOUR_STEPS } from "@/lib/tour-steps";
import { CheckCircle2, Compass, X } from "lucide-react";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function getTargetRect(selector: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function clipPath(rect: Rect | null): string {
  if (!rect) return "";
  const t = Math.max(0, rect.top - PAD);
  const l = Math.max(0, rect.left - PAD);
  const b = rect.top + rect.height + PAD;
  const r = rect.left + rect.width + PAD;
  return `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
}

function isMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

type TooltipPos = { top: number; left: number };

function computeTooltipPos(
  rect: Rect,
  placement: string,
  tooltipW: number,
  tooltipH: number,
): TooltipPos {
  const gap = 12;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "right":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + gap;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      break;
    case "top":
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "bottom":
    default:
      top = rect.top + rect.height + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
  }

  // Clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left < 8) left = 8;
  if (left + tooltipW > vw - 8) left = vw - tooltipW - 8;
  if (top < 8) top = 8;
  if (top + tooltipH > vh - 8) top = vh - tooltipH - 8;

  return { top, left };
}

export default function ProductTour() {
  const { isActive, currentStep, next, prev, skip, complete } = useProductTour();
  const { t } = useLocale();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const step = TOUR_STEPS[currentStep];
  const isCenter = step?.center || isMobile();
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const totalSteps = TOUR_STEPS.length;

  const recalc = useCallback(() => {
    if (!step || step.center) {
      setTargetRect(null);
      return;
    }

    if (isMobile()) {
      setTargetRect(null);
      return;
    }

    const rect = getTargetRect(step.target);
    setTargetRect(rect);

    if (rect && tooltipRef.current) {
      const tw = tooltipRef.current.offsetWidth;
      const th = tooltipRef.current.offsetHeight;
      setTooltipPos(computeTooltipPos(rect, step.placement, tw, th));
    }
  }, [step]);

  // Recalculate on step change
  useEffect(() => {
    if (!isActive) return;

    // Scroll target into view first, then recalculate
    if (step && !step.center && !isMobile()) {
      const el = step.target ? document.querySelector(step.target) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    // Small delay to allow scroll + render
    const timer = setTimeout(recalc, 100);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, recalc, step]);

  // Recalculate on resize/scroll
  useEffect(() => {
    if (!isActive) return;

    const handler = () => recalc();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isActive, recalc]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) complete();
        else next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, isLast, next, prev, skip, complete]);

  if (!mounted || !isActive || !step) return null;

  const stepCounter = t("tour.step_counter")
    .replace("{current}", String(currentStep + 1))
    .replace("{total}", String(totalSteps));

  // Center modal for welcome/finale or mobile
  if (isCenter) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-soft)]">
              {stepCounter}
            </div>
            <button
              onClick={skip}
              className="rounded-md p-1 text-[var(--muted-soft)] transition-colors hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center text-center">
            {isFirst && <Compass className="mb-3 h-10 w-10 text-[var(--primary)]" />}
            {isLast && <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />}
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {t(step.titleKey)}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t(step.descriptionKey)}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <div>
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={prev}>
                  {t("tour.btn.back")}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isLast && (
                <Button variant="ghost" size="sm" onClick={skip}>
                  {t("tour.btn.skip")}
                </Button>
              )}
              {isFirst ? (
                <Button size="sm" onClick={next}>
                  {t("tour.welcome.start")}
                </Button>
              ) : isLast ? (
                <Button size="sm" onClick={complete}>
                  {t("tour.complete.finish")}
                </Button>
              ) : (
                <Button size="sm" onClick={next}>
                  {t("tour.btn.next")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Spotlight + tooltip for targeted steps
  return createPortal(
    <>
      {/* Overlay with spotlight cutout */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 transition-[clip-path] duration-300"
        style={{ clipPath: targetRect ? clipPath(targetRect) : undefined }}
        onClick={skip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[61] w-80 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-xl transition-all duration-300"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted-soft)]">{stepCounter}</span>
          <button
            onClick={skip}
            className="rounded-md p-1 text-[var(--muted-soft)] transition-colors hover:text-[var(--foreground)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">
          {t(step.titleKey)}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t(step.descriptionKey)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prev}>
                {t("tour.btn.back")}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={skip}>
              {t("tour.btn.skip")}
            </Button>
            <Button size="sm" onClick={next}>
              {t("tour.btn.next")}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
