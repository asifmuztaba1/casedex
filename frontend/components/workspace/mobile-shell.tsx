"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  BookUser,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LibraryBig,
  LifeBuoy,
  LogOut,
  MessageSquareHeart,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserCircle,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
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
import { useLocale } from "@/components/locale-provider";
import { useAuth, useLogout } from "@/features/auth/use-auth";
import {
  useMarkNotificationRead,
  useNotifications,
  type NotificationSummary,
} from "@/features/notifications/use-notifications";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const LanguageSwitcher = dynamic(
  () => import("@/components/language-switcher"),
  { ssr: false }
);

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  ai?: boolean;
};

export const MOBILE_BOTTOM_TABS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/cases", labelKey: "nav.cases", icon: BookOpen },
  { href: "/hearings", labelKey: "nav.hearings", icon: Calendar },
  { href: "/ai", labelKey: "nav.ai", icon: Sparkles, ai: true },
];

export const MOBILE_MORE_NAV: NavItem[] = [
  { href: "/daily-register", labelKey: "nav.daily_register", icon: ClipboardList },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  { href: "/contacts", labelKey: "nav.contacts", icon: BookUser },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/library", labelKey: "nav.library", icon: LibraryBig },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/support", labelKey: "nav.support", icon: LifeBuoy },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
  { href: "/settings/billing", labelKey: "nav.billing", icon: CreditCard },
];

const TITLE_LOOKUP: Array<{ href: string; labelKey: string }> = [
  ...MOBILE_BOTTOM_TABS.map((t) => ({ href: t.href, labelKey: t.labelKey })),
  ...MOBILE_MORE_NAV.map((t) => ({ href: t.href, labelKey: t.labelKey })),
  { href: "/settings/profile", labelKey: "nav.profile" },
  { href: "/settings/team", labelKey: "nav.team" },
];

function notificationHref(notification: NotificationSummary): string {
  if (notification.case_public_id) {
    return `/cases/${notification.case_public_id}`;
  }
  const type = notification.notification_type ?? "";
  if (type.includes("cause_list") || type.includes("hearing")) return "/hearings";
  if (type.includes("document")) return "/documents";
  if (type.includes("invoice") || type.includes("billing")) return "/settings/billing";
  return "/notifications";
}

export function MobileTopBar({
  onOpenFeedback,
}: {
  onOpenFeedback: () => void;
}) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useAuth();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const { data: notificationsData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const isAdmin = user?.role === "admin";

  const notifications = notificationsData?.data ?? [];
  const unreadCount = notifications.filter((n) => n.status !== "read").length;
  const sortedNotifications = [...notifications].sort((a, b) => {
    const aUnread = a.status !== "read";
    const bUnread = b.status !== "read";
    if (aUnread === bUnread) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return aUnread ? -1 : 1;
  });

  const match = TITLE_LOOKUP.filter(
    (entry) => pathname === entry.href || pathname.startsWith(entry.href + "/")
  ).sort((a, b) => b.href.length - a.href.length)[0];
  const title = match ? t(match.labelKey) : "CaseDex";

  const isRootTab = MOBILE_BOTTOM_TABS.some(
    (tab) => pathname === tab.href || pathname === "/" + tab.href.split("/")[1]
  );

  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)]/95 backdrop-blur lg:hidden print:!hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        {isRootTab ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--wash)] text-sm font-bold text-[var(--foreground)]">
            CD
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nav.back")}
            onClick={() => router.back()}
            className="h-9 w-9 shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-[var(--foreground)]">
            {title}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 shrink-0"
              aria-label={t("nav.notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-1.5rem)] max-w-[340px] p-2">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-soft)]">
              {t("nav.notifications")}
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {sortedNotifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-3 py-4 text-sm text-[var(--muted)]">
                  {t("dashboard.empty")}
                </div>
              ) : (
                sortedNotifications.slice(0, 20).map((notification) => (
                  <Link
                    key={notification.public_id}
                    href={notificationHref(notification)}
                    onClick={() => {
                      if (notification.status !== "read") {
                        markRead.mutate(notification.public_id);
                      }
                    }}
                    className={cn(
                      "block rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-[var(--paper-hover)]",
                      notification.status === "read"
                        ? "border-[var(--border)] bg-[var(--paper)] text-[var(--muted)]"
                        : "border-[var(--border)] bg-[var(--wash)] text-[var(--foreground)]"
                    )}
                  >
                    <div className="text-sm font-medium">{notification.title}</div>
                    {notification.body && (
                      <div className="text-xs text-[var(--muted)]">{notification.body}</div>
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

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav.profile")}
              className="h-9 w-9 shrink-0"
            >
              <UserCircle className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-[360px] overflow-y-auto">
            <SheetTitle className="sr-only">{t("nav.profile")}</SheetTitle>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-[var(--paper)]">
                  {(user?.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {user?.name ?? ""}
                  </div>
                  <div className="truncate text-xs text-[var(--muted)]">
                    {user?.tenant?.name ?? user?.tenant_name ?? user?.email ?? ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="gap-2"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === "dark" ? "Light" : "Dark"}
                </Button>
                <LanguageSwitcher />
              </div>

              <div className="space-y-1">
                <Link
                  href="/settings/profile"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--paper-hover)]"
                >
                  <UserCircle className="h-4 w-4 text-[var(--muted-soft)]" />
                  {t("nav.profile")}
                </Link>
                {isAdmin && (
                  <Link
                    href="/settings/team"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--paper-hover)]"
                  >
                    <Users className="h-4 w-4 text-[var(--muted-soft)]" />
                    {t("nav.team")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onOpenFeedback();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--paper-hover)]"
                >
                  <MessageSquareHeart className="h-4 w-4 text-[var(--muted-soft)]" />
                  {t("nav.give_feedback")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav.sign_out")}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const moreIsActive = MOBILE_MORE_NAV.some((n) => isActive(n.href));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--paper)]/95 backdrop-blur lg:hidden print:!hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid h-16 grid-cols-5">
          {MOBILE_BOTTOM_TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? tab.ai
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-[var(--foreground)]"
                    : "text-[var(--muted-soft)]"
                )}
              >
                <Icon className={cn("h-5 w-5", active && tab.ai && "drop-shadow-[0_0_6px_rgba(139,92,246,0.45)]")} />
                <span className="leading-none">{t(tab.labelKey)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-current={moreIsActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              moreIsActive ? "text-[var(--foreground)]" : "text-[var(--muted-soft)]"
            )}
          >
            <MoreIcon active={moreIsActive} />
            <span className="leading-none">{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetTitle className="sr-only">{t("nav.more")}</SheetTitle>
          <div className="grid grid-cols-4 gap-3 pt-2">
            {MOBILE_MORE_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-[11px] font-medium transition-colors",
                    active
                      ? "border-[var(--foreground)] bg-[var(--wash)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--paper)] text-[var(--muted)] hover:bg-[var(--paper-hover)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-tight">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", active ? "text-[var(--foreground)]" : "text-[var(--muted-soft)]")}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
