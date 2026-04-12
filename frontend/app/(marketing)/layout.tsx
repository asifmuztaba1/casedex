"use client";

import OfflineIndicator from "@/components/offline-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowRight, Menu } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import CookieConsent from "@/components/cookie-consent";
import ThemeToggle from "@/components/theme-toggle";
import dynamic from "next/dynamic";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <div className="relative min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)]/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-2 px-3 py-3 md:gap-6 md:px-6 md:py-4">
            <a href="/" className="flex items-center gap-2 md:gap-3">
              <img
                src="/icons/icon-192.svg"
                alt="CaseDex"
                className="h-8 w-8 rounded-lg md:h-9 md:w-9"
              />
              <div className="text-sm font-semibold tracking-wide text-[var(--foreground)]">
                {"CaseDex\u2122"}
              </div>
            </a>
            <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
              <a className="hover:text-[var(--foreground)]" href="/about">
                {t("nav.about")}
              </a>
              <a className="hover:text-[var(--foreground)]" href="/features">
                {t("nav.features")}
              </a>
              <a className="hover:text-[var(--foreground)]" href="/pricing">
                {t("nav.pricing")}
              </a>
              <a className="hover:text-[var(--foreground)]" href="/contact">
                {t("nav.contact")}
              </a>
            </nav>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex md:items-center md:gap-3">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/login">{t("nav.login")}</a>
              </Button>
              <Button size="sm" asChild className="hidden md:inline-flex">
                <a href="/dashboard" className="inline-flex items-center gap-2">
                  {t("nav.dashboard_open")}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetTitle className="sr-only">{t("nav.workspace")}</SheetTitle>
                  <nav className="space-y-4 pt-4">
                    <a className="block text-base font-medium text-[var(--foreground)]" href="/about">
                      {t("nav.about")}
                    </a>
                    <a className="block text-base font-medium text-[var(--foreground)]" href="/features">
                      {t("nav.features")}
                    </a>
                    <a className="block text-base font-medium text-[var(--foreground)]" href="/pricing">
                      {t("nav.pricing")}
                    </a>
                    <a className="block text-base font-medium text-[var(--foreground)]" href="/contact">
                      {t("nav.contact")}
                    </a>
                    <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
                      <ThemeToggle />
                      <LanguageSwitcher />
                    </div>
                    <Button asChild className="w-full">
                      <a href="/register" className="inline-flex items-center justify-center gap-2">
                        {t("home.cta.start")}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <a href="/dashboard">{t("nav.dashboard_open")}</a>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
              <OfflineIndicator />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-3 py-8 md:px-6 md:py-14">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] bg-[var(--paper)]/95">
          <div className="mx-auto w-full max-w-[1200px] px-3 py-8 md:px-6 md:py-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/icon-192.svg"
                    alt="CaseDex"
                    className="h-7 w-7 rounded-md"
                  />
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    CaseDex
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {t("footer.tagline")}
                </p>
                <div className="text-xs text-[var(--muted-soft)]">
                  {t("footer.note")}
                </div>
              </div>
              <div className="space-y-2 text-sm text-[var(--muted)]">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("footer.product")}
                </div>
                <a className="block hover:text-[var(--foreground)]" href="/features">
                  {t("nav.features")}
                </a>
                <a className="block hover:text-[var(--foreground)]" href="/security">
                  {t("nav.security")}
                </a>
                <a className="block hover:text-[var(--foreground)]" href="/pricing">
                  {t("nav.pricing")}
                </a>
              </div>
              <div className="space-y-2 text-sm text-[var(--muted)]">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  {t("footer.company")}
                </div>
                <a className="block hover:text-[var(--foreground)]" href="/privacy">
                  {t("nav.privacy")}
                </a>
                <a className="block hover:text-[var(--foreground)]" href="/terms">
                  {t("nav.terms")}
                </a>
                <a className="block hover:text-[var(--foreground)]" href="/about">
                  {t("nav.about")}
                </a>
                <a className="block hover:text-[var(--foreground)]" href="/contact">
                  {t("footer.contact")}
                </a>
              </div>
            </div>
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <p className="text-xs leading-relaxed text-[var(--muted-soft)]">
                {t("footer.disclaimer")}
              </p>
            </div>
          </div>
        </footer>
        <CookieConsent />
      </div>
    </div>
  );
}
const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher"),
  { ssr: false }
);
