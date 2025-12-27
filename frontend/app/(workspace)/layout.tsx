"use client";

import AuthGuard from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/features/auth/use-auth";
import { useNotifications } from "@/features/notifications/use-notifications";
import { useLocale } from "@/components/locale-provider";
import LanguageSwitcher from "@/components/language-switcher";
import { useEffect } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  UserCircle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/cases", labelKey: "nav.cases", icon: BookOpen },
  { href: "/hearings", labelKey: "nav.hearings", icon: Calendar },
  { href: "/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useAuth();
  const logout = useLogout();
  const { locale, setLocale, t } = useLocale();
  const { data: notificationsData } = useNotifications();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col border-r border-slate-200 bg-white px-5 py-6 md:flex">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t("nav.workspace")}
          </div>
          <div className="text-lg font-semibold text-slate-900">CaseDex</div>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <item.icon className="h-4 w-4 text-slate-400" />
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <Card className="mt-auto border-dashed bg-slate-50 p-4 text-xs text-slate-500 shadow-none">
          {t("nav.offline_hint")}
        </Card>
      </aside>

      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {t("nav.workspace")}
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        CaseDex
                      </div>
                    </div>
                    <nav className="space-y-1">
                      {navItems.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <item.icon className="h-4 w-4 text-slate-400" />
                          {t(item.labelKey)}
                        </a>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {t("nav.workspace")}
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {t("nav.workspace_overview")}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input className="w-[220px]" placeholder={t("nav.search")} />
              <Badge variant="subtle">
                {t("nav.tenant")}: Demo
              </Badge>
              <Button size="sm" asChild>
                <a href="/cases/new">{t("nav.new_case")}</a>
              </Button>
              <LanguageSwitcher />
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
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[320px] p-2">
                  <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t("nav.notifications")}
                  </div>
                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {sortedNotifications.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                        {t("dashboard.empty")}
                      </div>
                    ) : (
                      sortedNotifications.map((notification) => (
                        <div
                          key={notification.public_id}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            notification.status === "read"
                              ? "border-slate-200 bg-white text-slate-700"
                              : "border-slate-200 bg-slate-100 text-slate-900"
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {notification.title}
                          </div>
                          {notification.body && (
                            <div className="text-xs text-slate-600">
                              {notification.body}
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-slate-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <DropdownMenuItem asChild>
                    <a href="/settings/team">{t("nav.team")}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    className="text-rose-600"
                  >
                    {t("nav.sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
    </div>
  );
}
