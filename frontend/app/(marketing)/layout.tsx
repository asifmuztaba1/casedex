"use client";

import OfflineIndicator from "@/components/offline-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import dynamic from "next/dynamic";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold">
                CD
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">
                  {"CaseDex\u2122"}
                </div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  {t("nav.workspace")}
                </div>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
              <a className="hover:text-slate-900" href="/about">
                {t("nav.about")}
              </a>
              <a className="hover:text-slate-900" href="/features">
                {t("nav.features")}
              </a>
              <a className="hover:text-slate-900" href="/pricing">
                {t("nav.pricing")}
              </a>
              <a className="hover:text-slate-900" href="/security">
                {t("nav.security")}
              </a>
              <a className="hover:text-slate-900" href="/privacy">
                {t("nav.privacy")}
              </a>
              <a className="hover:text-slate-900" href="/terms">
                {t("nav.terms")}
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Badge variant="subtle">{t("nav.pwa")}</Badge>
              <LanguageSwitcher />
              <Button variant="outline" size="sm" asChild>
                <a href="/login">{t("nav.login")}</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/dashboard" className="inline-flex items-center gap-2">
                  {t("nav.dashboard_open")}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <OfflineIndicator />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-6 py-14">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white/95">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900">
                  CaseDex
                </div>
                <p className="text-sm text-slate-600">
                  {t("footer.subtitle")}
                </p>
                <div className="text-xs text-slate-500">
                  {t("footer.note")}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("footer.product")}
                </div>
                <a className="block hover:text-slate-900" href="/features">
                  {t("nav.features")}
                </a>
                <a className="block hover:text-slate-900" href="/security">
                  {t("nav.security")}
                </a>
                <a className="block hover:text-slate-900" href="/pricing">
                  {t("nav.pricing")}
                </a>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("footer.company")}
                </div>
                <a className="block hover:text-slate-900" href="/privacy">
                  {t("nav.privacy")}
                </a>
                <a className="block hover:text-slate-900" href="/terms">
                  {t("nav.terms")}
                </a>
                <a className="block hover:text-slate-900" href="/about">
                  {t("nav.about")}
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher"),
  { ssr: false }
);
