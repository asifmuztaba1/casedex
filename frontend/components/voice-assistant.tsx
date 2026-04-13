"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { getAssistantScript } from "@/lib/assistant-scripts";

const FIRST_VISIT_PREFIX = "casedex_assistant_visited_";
const ASSISTANT_ENABLED_KEY = "casedex_assistant_enabled";
const TIP_DISMISSED_KEY = "casedex_assistant_tip_dismissed";

/** Check if a page has been visited before (for auto-play on first visit). */
function isFirstVisit(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  const key = FIRST_VISIT_PREFIX + pathname.replace(/\//g, "_");
  return !localStorage.getItem(key);
}

function markVisited(pathname: string): void {
  if (typeof window === "undefined") return;
  const key = FIRST_VISIT_PREFIX + pathname.replace(/\//g, "_");
  localStorage.setItem(key, "true");
}

function isAssistantEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ASSISTANT_ENABLED_KEY) !== "false";
}

export default function VoiceAssistant() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [currentText, setCurrentText] = useState("");
  const [showTip, setShowTip] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasAutoPlayedRef = useRef<string | null>(null);

  // Load enabled state
  useEffect(() => {
    setEnabled(isAssistantEnabled());
  }, []);

  // Show tip every session until user dismisses it
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(TIP_DISMISSED_KEY)) return;
    const timer = setTimeout(() => setShowTip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === "bn" ? "bn-BD" : "en-US";
      utterance.rate = locale === "bn" ? 0.9 : 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = locale === "bn" ? "bn" : "en";
      const preferred = voices.find(
        (v) => v.lang.startsWith(langPrefix) && (v.name.includes("Google") || v.name.includes("Microsoft"))
      );
      const fallback = voices.find((v) => v.lang.startsWith(langPrefix));
      if (preferred) utterance.voice = preferred;
      else if (fallback) utterance.voice = fallback;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      setCurrentText(text);
      setExpanded(true);
      window.speechSynthesis.speak(utterance);
    },
    [locale, stop],
  );

  // Auto-play on first visit to a page
  useEffect(() => {
    if (!enabled) return;
    if (hasAutoPlayedRef.current === pathname) return;

    const script = getAssistantScript(pathname);
    if (!script) return;
    if (!isFirstVisit(pathname)) return;

    hasAutoPlayedRef.current = pathname;
    markVisited(pathname);

    // Small delay to let the page render
    const timer = setTimeout(() => {
      speak(locale === "bn" ? script.bn : script.en);
    }, 1500);
    return () => clearTimeout(timer);
  }, [pathname, locale, enabled, speak]);

  // Ensure voices are loaded (Chrome loads them async)
  useEffect(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  // Stop speaking on route change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [pathname]);

  const handleToggle = () => {
    if (speaking) {
      stop();
      return;
    }
    const script = getAssistantScript(pathname);
    if (script) {
      speak(locale === "bn" ? script.bn : script.en);
    }
  };

  const handleToggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(ASSISTANT_ENABLED_KEY, String(next));
    if (!next) {
      stop();
      setExpanded(false);
    }
  };

  const handleClose = () => {
    stop();
    setExpanded(false);
  };

  const script = getAssistantScript(pathname);
  if (!script) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 print:hidden">
      {/* Expanded panel showing transcript */}
      {expanded && (
        <div className="w-80 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  speaking ? "animate-pulse bg-emerald-500" : "bg-[var(--muted-soft)]"
                }`}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                {locale === "bn" ? "সহকারী" : "Assistant"}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="rounded-md p-1 text-[var(--muted-soft)] transition-colors hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-[var(--foreground)]">
            {currentText}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant={speaking ? "default" : "outline"}
              onClick={handleToggle}
              className="gap-1.5"
            >
              {speaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  {locale === "bn" ? "থামান" : "Stop"}
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  {locale === "bn" ? "আবার শুনুন" : "Replay"}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleEnabled}
              className="ml-auto text-xs text-[var(--muted)]"
            >
              {locale === "bn" ? "সহকারী বন্ধ করুন" : "Turn off assistant"}
            </Button>
          </div>
        </div>
      )}

      {/* Tip text */}
      {showTip && !expanded && (
        <div
          className="relative flex items-center gap-1.5 rounded-lg py-1.5 pl-3 pr-1.5 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ background: "linear-gradient(135deg, #6366f1, #ec4899, #f59e0b)" }}
        >
          <span className="whitespace-nowrap">
            {locale === "bn" ? "গাইডেন্সের জন্য ক্লিক করুন" : "Click me for guidance"}
          </span>
          <button
            onClick={() => {
              setShowTip(false);
              sessionStorage.setItem(TIP_DISMISSED_KEY, "true");
            }}
            className="shrink-0 rounded p-0.5 text-white/70 transition-colors hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
          <span
            className="absolute -bottom-1 right-6 h-2 w-2 rotate-45"
            style={{ background: "#ec4899" }}
          />
        </div>
      )}

      {/* Siri-style animated orb */}
      <button
        onClick={enabled ? handleToggle : handleToggleEnabled}
        className="group relative flex h-14 w-14 items-center justify-center"
        title={
          enabled
            ? speaking
              ? locale === "bn"
                ? "থামান"
                : "Stop"
              : locale === "bn"
                ? "সহকারী শুনুন"
                : "Listen to assistant"
            : locale === "bn"
              ? "সহকারী চালু করুন"
              : "Enable assistant"
        }
      >
        {/* Outer glow */}
        <span
          className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${
            speaking ? "opacity-60" : "opacity-30 group-hover:opacity-50"
          }`}
          style={{
            background: enabled
              ? "conic-gradient(from 0deg, #6366f1, #ec4899, #f59e0b, #10b981, #3b82f6, #6366f1)"
              : "#94a3b8",
          }}
        />
        {/* Spinning gradient border */}
        <span
          className={`absolute inset-0 rounded-full ${
            enabled ? (speaking ? "animate-[spin_2s_linear_infinite]" : "animate-[spin_6s_linear_infinite]") : ""
          }`}
          style={{
            background: enabled
              ? "conic-gradient(from 0deg, #6366f1, #ec4899, #f59e0b, #10b981, #3b82f6, #6366f1)"
              : "#94a3b8",
            padding: "2.5px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        {/* Inner orb */}
        <span
          className={`absolute inset-[3px] rounded-full transition-all duration-500 ${
            speaking ? "scale-95" : "scale-100 group-hover:scale-95"
          }`}
          style={{
            background: enabled
              ? "radial-gradient(circle at 35% 35%, #818cf8, #6366f1 40%, #4f46e5 70%, #3730a3)"
              : "#64748b",
          }}
        />
        {/* Pulse rings when speaking */}
        {speaking && enabled && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" style={{ animationDuration: "1.5s" }} />
            <span className="absolute inset-[-4px] animate-ping rounded-full bg-pink-400/10" style={{ animationDuration: "2s" }} />
          </>
        )}
        {/* Center icon/dot */}
        <span className={`relative z-10 h-2.5 w-2.5 rounded-full transition-all duration-300 ${
          speaking
            ? "scale-150 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            : enabled
              ? "bg-white/80 group-hover:bg-white group-hover:shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              : "bg-white/50"
        }`} />
      </button>
    </div>
  );
}
