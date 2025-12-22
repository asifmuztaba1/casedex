import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: BookOpen },
  { href: "/hearings", label: "Hearings", icon: Calendar },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col border-r border-slate-200 bg-white px-5 py-6 md:flex">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Workspace
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
              {item.label}
            </a>
          ))}
        </nav>
        <Card className="mt-auto border-dashed bg-slate-50 p-4 text-xs text-slate-500 shadow-none">
          Offline read-only access is available for core lists.
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
                        Workspace
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
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Workspace
                </div>
                <div className="text-sm font-medium text-slate-900">
                  Case workspace overview
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input className="w-[220px]" placeholder="Search cases" />
              <Badge variant="subtle">Tenant: Demo</Badge>
              <Button size="sm" asChild>
                <a href="/cases/new">New case</a>
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
