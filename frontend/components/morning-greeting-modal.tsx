"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { useAuth } from "@/features/auth/use-auth";
import { useDailyBriefing } from "@/features/daily-briefing/use-daily-briefing";
import { CalendarClock, ClipboardList, FileClock, ListChecks } from "lucide-react";

const TOUR_COMPLETED_KEY = "casedex_tour_completed";
const SHOWN_PREFIX = "casedex_briefing_shown_";
/** Small buffer after mount so modal doesn't stack with product tour / install prompt. */
const APPEAR_DELAY_MS = 3000;

function greetingKey(hour: number): "good_morning" | "good_afternoon" | "good_evening" {
  if (hour >= 5 && hour < 12) return "good_morning";
  if (hour >= 12 && hour < 17) return "good_afternoon";
  return "good_evening";
}

export default function MorningGreetingModal() {
  const { t, locale } = useLocale();
  const { data: user } = useAuth();
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);

  // Eligibility gate — run once on mount. Skip if:
  //  - already shown today
  //  - product tour hasn't been completed (new user; let the tour run first)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tourDone = window.localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
    if (!tourDone) return;

    const todayKey = `${SHOWN_PREFIX}${format(new Date(), "yyyy-MM-dd")}`;
    if (window.localStorage.getItem(todayKey) === "true") return;

    const timer = setTimeout(() => setEligible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const { data } = useDailyBriefing(eligible);
  const briefing = data?.data;

  // Open once briefing is fetched and it has content
  useEffect(() => {
    if (!eligible || !briefing) return;
    if (!briefing.has_any) {
      // Nothing interesting to show — mark shown so we don't keep polling today
      markShown();
      return;
    }
    setOpen(true);
  }, [eligible, briefing]);

  function markShown() {
    if (typeof window === "undefined") return;
    const todayKey = `${SHOWN_PREFIX}${format(new Date(), "yyyy-MM-dd")}`;
    window.localStorage.setItem(todayKey, "true");
  }

  function handleOpenChange(next: boolean) {
    if (!next) markShown();
    setOpen(next);
  }

  if (!briefing || !briefing.has_any) return null;

  const hour = new Date().getHours();
  const greeting = t(`briefing.${greetingKey(hour)}`);
  const firstName = (user?.name ?? "").split(" ")[0] ?? "";

  const firstHearing = briefing.first_hearing;
  const firstHearingTime = firstHearing?.at
    ? format(new Date(firstHearing.at), "h:mm a")
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
            {locale === "bn" ? "!" : "!"}
          </DialogTitle>
        </DialogHeader>

        <ul className="space-y-3 pt-2 text-sm">
          {briefing.hearings_today > 0 && (
            <li className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span>
                <span className="font-medium">
                  {t("briefing.hearings_today_prefix")}{" "}
                  {briefing.hearings_today}
                  {locale === "bn" ? "টি" : ""}{" "}
                  {briefing.hearings_today === 1
                    ? t("briefing.hearing_word")
                    : t("briefing.hearings_word")}
                </span>
                {firstHearingTime && firstHearing?.case_title && (
                  <span className="block text-[var(--muted)]">
                    {t("briefing.first")}: {firstHearingTime} — {firstHearing.case_title}
                    {firstHearing.court ? ` @ ${firstHearing.court}` : ""}
                  </span>
                )}
              </span>
            </li>
          )}

          {briefing.pending_outcomes_yesterday > 0 && (
            <li className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                {briefing.pending_outcomes_yesterday}
                {locale === "bn" ? "টি " : " "}
                {t("briefing.pending_outcomes")}
              </span>
            </li>
          )}

          {briefing.cause_list_matches_today > 0 && (
            <li className="flex items-start gap-3">
              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                {briefing.cause_list_matches_today}
                {locale === "bn" ? "টি " : " "}
                {t("briefing.cause_list_matches")}
              </span>
            </li>
          )}

          {briefing.document_deadlines_today > 0 && (
            <li className="flex items-start gap-3">
              <FileClock className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span>
                {briefing.document_deadlines_today}
                {locale === "bn" ? "টি " : " "}
                {t("briefing.document_deadlines")}
              </span>
            </li>
          )}
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("briefing.got_it")}
          </Button>
          <Button asChild onClick={() => handleOpenChange(false)}>
            <Link href="/daily-register">{t("briefing.open_daily_register")}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
