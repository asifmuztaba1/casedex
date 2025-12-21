export default function CasesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Cases
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Case list</h1>
        <p className="text-sm text-slate-600">
          Read-only offline access is enabled for recent cases.
        </p>
      </header>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">No cases loaded yet.</p>
      </div>
    </section>
  );
}
