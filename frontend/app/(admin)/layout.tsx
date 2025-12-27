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
import { Settings, ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import LanguageSwitcher from "@/components/language-switcher";

const adminNav = [
  { href: "/admin", key: "admin.nav.dashboard" },
  { href: "/admin/courts", key: "admin.nav.courts" },
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
          <aside className="hidden w-[260px] flex-col border-r border-slate-200 bg-white px-6 py-6 lg:flex">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <span>{t("admin.title")}</span>
            </div>
            <div className="mt-6 space-y-1 text-sm">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {t(item.key)}
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Link
                href="/dashboard"
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                {t("admin.nav.workspace")}
              </Link>
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
              <div className="flex items-center gap-3">
                <Badge variant="subtle">{t("admin.badge")}</Badge>
                <span className="text-sm text-slate-600">
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
