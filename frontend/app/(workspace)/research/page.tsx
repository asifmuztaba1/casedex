export default function ResearchPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Research
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Research notes</h1>
        <p className="text-sm text-slate-600">
          Keep citations and summaries organized for each matter.
        </p>
      </header>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">No research notes yet.</p>
      </div>
    </section>
  );
}
