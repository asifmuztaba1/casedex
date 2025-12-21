export default function DiaryPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Diary
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Diary entries</h1>
        <p className="text-sm text-slate-600">
          Recent entries are cached for offline reading.
        </p>
      </header>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">No diary entries yet.</p>
      </div>
    </section>
  );
}
