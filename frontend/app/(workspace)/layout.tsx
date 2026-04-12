"use client";

import AuthGuard from "@/components/auth-guard";
import { TourProvider } from "@/components/tour-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/features/auth/use-auth";
import { useSubscription } from "@/features/billing/use-billing";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/use-notifications";
import { useLocale } from "@/components/locale-provider";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { NotificationSummary } from "@/features/notifications/use-notifications";
import ThemeToggle from "@/components/theme-toggle";
import {
  Bell,
  BookOpen,
  BookUser,
  CreditCard,
  Calendar,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LibraryBig,
  LifeBuoy,
  Menu,
  Settings,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";

function notificationHref(notification: NotificationSummary): string {
  if (notification.case_public_id) {
    return `/cases/${notification.case_public_id}`;
  }
  const type = notification.notification_type ?? "";
  if (type.includes("cause_list")) {
    return "/hearings";
  }
  if (type.includes("hearing")) {
    return "/hearings";
  }
  if (type.includes("document")) {
    return "/documents";
  }
  if (type.includes("invoice") || type.includes("billing")) {
    return "/settings/billing";
  }
  return "/notifications";
}

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/cases", labelKey: "nav.cases", icon: BookOpen, tourId: "nav-cases" },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  { href: "/contacts", labelKey: "nav.contacts", icon: BookUser },
  { href: "/hearings", labelKey: "nav.hearings", icon: Calendar, tourId: "nav-hearings" },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/documents", labelKey: "nav.documents", icon: FileText, tourId: "nav-documents" },
  { href: "/library", labelKey: "nav.library", icon: LibraryBig },
  { href: "/ai", labelKey: "nav.ai", icon: Sparkles, ai: true, tourId: "nav-ai" },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/support", labelKey: "nav.support", icon: LifeBuoy },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, tourId: "nav-settings" },
  { href: "/settings/billing", labelKey: "nav.billing", icon: CreditCard },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useAuth();
  const isAdmin = user?.role === "admin";
  const logout = useLogout();
  const { data: subscription } = useSubscription();
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const activeHref = useMemo(() => {
    let best: string | null = null;
    for (const item of navItems) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        if (!best || item.href.length > best.length) {
          best = item.href;
        }
      }
    }
    return best;
  }, [pathname]);
  const { data: notificationsData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const notifications = notificationsData?.data ?? [];
  const unreadCount = notifications.filter(
    (notification) => notification.status !== "read"
  ).length;
  const sortedNotifications = [...notifications].sort((a, b) => {
    const aUnread = a.status !== "read";
    const bUnread = b.status !== "read";
    if (aUnread === bUnread) {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    }
    return aUnread ? -1 : 1;
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    const preferred = user.locale ?? user.tenant_locale ?? locale;
    if (preferred && preferred !== locale) {
      setLocale(preferred);
    }
  }, [user, locale, setLocale]);

  const showSubscriptionWall =
    subscription?.status === "expired" &&
    pathname !== "/settings/billing";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col border-r border-[var(--border)] bg-[var(--paper)] px-5 py-6 md:flex">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted-soft)]">
            {t("nav.workspace")}
          </div>
          <div className="text-lg font-semibold text-[var(--foreground)]">CaseDex</div>
        </div>
        <nav className="mt-8 space-y-1" data-tour="sidebar-nav">
          {navItems.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                data-tour={item.tourId}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? item.ai
                      ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "bg-[var(--wash)] font-semibold text-[var(--foreground)]"
                    : item.ai
                      ? "text-violet-600 hover:bg-[var(--paper-hover)] dark:text-violet-400"
                      : "text-[var(--muted)] hover:bg-[var(--paper-hover)]"
                }`}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isActive
                      ? item.ai
                        ? "text-violet-600 dark:text-violet-300"
                        : "text-[var(--foreground)]"
                      : item.ai
                        ? "text-violet-500 dark:text-violet-400"
                        : "text-[var(--muted-soft)]"
                  }`}
                />
                {t(item.labelKey)}
                {item.ai && (
                  <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    AI
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--paper)]/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-3 py-3 md:gap-4 md:px-6 md:py-4">
            <div className="flex items-center gap-3">
              <Sheet>
                {mounted ? (
                  <>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="md:hidden">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetTitle className="sr-only">
                        {t("nav.workspace")}
                      </SheetTitle>
                      <div className="space-y-6">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted-soft)]">
                            {t("nav.workspace")}
                          </div>
                          <div className="text-lg font-semibold text-[var(--foreground)]">
                            CaseDex
                          </div>
                        </div>
                        <nav className="space-y-1">
                          {navItems.map((item) => {
                            const isActive = item.href === activeHref;
                            return (
                              <a
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                  isActive
                                    ? item.ai
                                      ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                                      : "bg-[var(--wash)] font-semibold text-[var(--foreground)]"
                                    : item.ai
                                      ? "text-violet-600 hover:bg-[var(--paper-hover)] dark:text-violet-400"
                                      : "text-[var(--muted)] hover:bg-[var(--paper-hover)]"
                                }`}
                              >
                                <item.icon
                                  className={`h-4 w-4 ${
                                    isActive
                                      ? item.ai
                                        ? "text-violet-600 dark:text-violet-300"
                                        : "text-[var(--foreground)]"
                                      : item.ai
                                        ? "text-violet-500 dark:text-violet-400"
                                        : "text-[var(--muted-soft)]"
                                  }`}
                                />
                                {t(item.labelKey)}
                                {item.ai && (
                                  <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                                    AI
                                  </span>
                                )}
                              </a>
                            );
                          })}
                        </nav>
                      </div>
                    </SheetContent>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="md:hidden" disabled>
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
              </Sheet>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted-soft)]">
                  {t("nav.workspace")}
                </div>
                <div className="text-sm font-medium text-[var(--foreground)]">
                  {t("nav.workspace_overview")}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Input className="hidden w-[220px] md:block" placeholder={t("nav.search")} />
              <Badge variant="subtle">
                {user?.tenant?.name ?? user?.tenant_name ?? "-"}
              </Badge>
              {subscription?.on_trial && subscription?.trial_ends_at && (
                <Badge>
                  {t("billing.trial_ends")}: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                </Badge>
              )}
              <ThemeToggle />
              {mounted && <span data-tour="lang-switcher"><LanguageSwitcher /></span>}
              {mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--foreground)] px-1 text-[10px] font-semibold text-[var(--paper)]">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-[320px] p-2">
                    <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-soft)]">
                      {t("nav.notifications")}
                    </div>
                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {sortedNotifications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-3 py-4 text-sm text-[var(--muted)]">
                          {t("dashboard.empty")}
                        </div>
                      ) : (
                        sortedNotifications.map((notification) => (
                          <Link
                            key={notification.public_id}
                            href={notificationHref(notification)}
                            onClick={() => {
                              if (notification.status !== "read") {
                                markRead.mutate(notification.public_id);
                              }
                            }}
                            className={`block rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-[var(--paper-hover)] ${
                              notification.status === "read"
                                ? "border-[var(--border)] bg-[var(--paper)] text-[var(--muted)]"
                                : "border-[var(--border)] bg-[var(--wash)] text-[var(--foreground)]"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {notification.title}
                            </div>
                            {notification.body && (
                              <div className="text-xs text-[var(--muted)]">
                                {notification.body}
                              </div>
                            )}
                            <div className="mt-1 text-[11px] text-[var(--muted-soft)]">
                              {new Date(notification.created_at).toLocaleString()}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" aria-label="Notifications" disabled>
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              {mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserCircle className="h-4 w-4" />
                      {user?.name ?? t("nav.profile")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href="/settings/profile">{t("nav.profile")}</a>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <a href="/settings/team">{t("nav.team")}</a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => logout.mutate()}
                      className="text-rose-600"
                    >
                      {t("nav.sign_out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  <UserCircle className="h-4 w-4" />
                  {t("nav.profile")}
                </Button>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-3 py-4 md:px-6 md:py-6">
          <TourProvider>
            <AuthGuard>{children}</AuthGuard>
            <ProductTour />
          </TourProvider>
        </main>
      </div>
      {showSubscriptionWall && <SubscriptionWall />}
    </div>
  );
}
const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher"),
  { ssr: false }
);
const ProductTour = dynamic(() => import("@/components/product-tour"), {
  ssr: false,
});
const SubscriptionWall = dynamic(() => import("@/components/subscription-wall"), {
  ssr: false,
});
