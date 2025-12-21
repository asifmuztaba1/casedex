export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Workspace
        </p>
        <nav className="space-y-2 text-sm">
          {[
            { href: "/cases", label: "Cases" },
            { href: "/hearings", label: "Hearings" },
            { href: "/diary", label: "Diary" },
            { href: "/documents", label: "Documents" },
            { href: "/research", label: "Research" },
            { href: "/notifications", label: "Notifications" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
