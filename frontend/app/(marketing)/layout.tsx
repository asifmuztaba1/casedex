import OfflineIndicator from "@/components/offline-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                  Case workspace
                </div>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
              <a className="hover:text-slate-900" href="/about">
                About
              </a>
              <a className="hover:text-slate-900" href="/features">
                Features
              </a>
              <a className="hover:text-slate-900" href="/pricing">
                Pricing
              </a>
              <a className="hover:text-slate-900" href="/security">
                Security
              </a>
              <a className="hover:text-slate-900" href="/privacy">
                Privacy
              </a>
              <a className="hover:text-slate-900" href="/terms">
                Terms
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Badge variant="subtle">PWA-ready</Badge>
              <Button variant="outline" size="sm" asChild>
                <a href="/login">Log in</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/dashboard" className="inline-flex items-center gap-2">
                  Open dashboard
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
                  A structured case workspace for legal professionals and law
                  students.
                </p>
                <div className="text-xs text-slate-500">
                  CaseDex assists memory, not decisions.
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </div>
                <a className="block hover:text-slate-900" href="/features">
                  Features
                </a>
                <a className="block hover:text-slate-900" href="/security">
                  Security
                </a>
                <a className="block hover:text-slate-900" href="/pricing">
                  Pricing
                </a>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </div>
                <a className="block hover:text-slate-900" href="/privacy">
                  Privacy
                </a>
                <a className="block hover:text-slate-900" href="/terms">
                  Terms
                </a>
                <a className="block hover:text-slate-900" href="/about">
                  About
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}