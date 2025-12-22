export default function SettingsPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Workspace settings
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Configure users, notifications, and tenant preferences.
        </p>
      </div>
    </section>
  );
}
