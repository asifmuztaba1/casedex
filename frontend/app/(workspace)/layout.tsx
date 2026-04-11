"use client";

import AuthGuard from "@/components/auth-guard";
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
import { useNotifications } from "@/features/notifications/use-notifications";
import { useLocale } from "@/components/locale-provider";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
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
  LifeBuoy,
  Menu,
  Settings,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/cases", labelKey: "nav.cases", icon: BookOpen },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  { href: "/contacts", labelKey: "nav.contacts", icon: BookUser },
  { href: "/hearings", labelKey: "nav.hearings", icon: Calendar },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/ai", labelKey: "nav.ai", icon: Sparkles },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/support", labelKey: "nav.support", icon: LifeBuoy },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
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
  const { data: notificationsData } = useNotifications();
  const mounted = true;
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
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--paper-hover)]"
            >
              <item.icon className="h-4 w-4 text-[var(--muted-soft)]" />
              {t(item.labelKey)}
            </a>
          ))}
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
                          {navItems.map((item) => (
                            <a
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--paper-hover)]"
                            >
                              <item.icon className="h-4 w-4 text-[var(--muted-soft)]" />
                              {t(item.labelKey)}
                            </a>
                          ))}
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
              {mounted && <LanguageSwitcher />}
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
                          <div
                            key={notification.public_id}
                            className={`rounded-xl border px-3 py-2 text-sm ${
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
                          </div>
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
          <AuthGuard>{children}</AuthGuard>
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
const SubscriptionWall = dynamic(() => import("@/components/subscription-wall"), {
  ssr: false,
});
