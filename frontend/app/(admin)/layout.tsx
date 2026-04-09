"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/admin-guard";
import { useAuth, useLogout } from "@/features/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Settings, ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import dynamic from "next/dynamic";

const adminNav = [
  { href: "/admin", key: "admin.nav.dashboard" },
  { href: "/admin/tenants", key: "admin.nav.tenants" },
  { href: "/admin/users", key: "admin.nav.users" },
  { href: "/admin/courts", key: "admin.nav.courts" },
  { href: "/admin/manual-payments", key: "admin.nav.manual_payments" },
  { href: "/admin/ai-payments", key: "admin.nav.ai_payments" },
  { href: "/admin/support", key: "admin.nav.support" },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useAuth();
  const { t } = useLocale();
  const logout = useLogout();
  const pathname = usePathname();

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[var(--wash)] text-[var(--foreground)]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
          <aside className="hidden w-[260px] flex-col border-r border-[var(--border)] bg-[var(--paper)] px-6 py-6 lg:flex">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-[var(--muted)]" />
              <span>{t("admin.title")}</span>
            </div>
            <div className="mt-6 space-y-1 text-sm">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--paper-hover)] hover:text-[var(--foreground)]"
                >
                  {t(item.key)}
                </Link>
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--border)] pt-4">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-soft)]">
                {t("admin.nav.tools")}
              </div>
              <div className="space-y-1 text-sm">
                <a
                  href="/horizon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--paper-hover)] hover:text-[var(--foreground)]"
                >
                  {t("admin.nav.horizon")}
                  <ExternalLink className="h-3 w-3 opacity-40" />
                </a>
                <a
                  href="/telescope"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--paper-hover)] hover:text-[var(--foreground)]"
                >
                  {t("admin.nav.telescope")}
                  <ExternalLink className="h-3 w-3 opacity-40" />
                </a>
                {process.env.NEXT_PUBLIC_SENTRY_DSN && (
                  <a
                    href="https://sentry.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[var(--muted)] hover:bg-[var(--paper-hover)] hover:text-[var(--foreground)]"
                  >
                    {t("admin.nav.sentry")}
                    <ExternalLink className="h-3 w-3 opacity-40" />
                  </a>
                )}
              </div>
            </div>
            <div className="mt-auto pt-6">
              <Link
                href="/dashboard"
                className="text-xs text-[var(--muted-soft)] hover:text-[var(--muted)]"
              >
                {t("admin.nav.workspace")}
              </Link>
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--paper)] px-6">
              <div className="flex items-center gap-3">
                <Badge variant="subtle">{t("admin.badge")}</Badge>
                <span className="text-sm text-[var(--muted)]">
                  {t("admin.subtitle")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      {user?.name ?? t("admin.user")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => logout.mutate()}>
                      {t("nav.sign_out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main className="flex-1 px-6 py-6">{children}</main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher"),
  { ssr: false }
);
