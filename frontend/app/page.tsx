export default function Home() {
  return (
    <section className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workspace overview
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              CaseDex is a structured case workspace for legal professionals and
              law students.
            </h1>
            <p className="text-base leading-relaxed text-slate-600">
              Organize matters, track hearings, and keep a reliable diary. AI
              assistance supports summaries while you stay in control.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white"
              href="/cases"
            >
              Open cases
            </a>
            <a
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700"
              href="/hearings"
            >
              View hearings
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Cases",
            description: "Track active matters and key status changes.",
            href: "/cases",
          },
          {
            title: "Hearings",
            description: "Prepare upcoming hearings and log outcomes.",
            href: "/hearings",
          },
          {
            title: "Diary",
            description: "Maintain daily case notes with structured prompts.",
            href: "/diary",
          },
          {
            title: "Documents",
            description: "Keep document metadata organized and searchable.",
            href: "/documents",
          },
          {
            title: "Research",
            description: "Capture citations, summaries, and analysis notes.",
            href: "/research",
          },
          {
            title: "Notifications",
            description: "Review alerts for deadlines and hearing updates.",
            href: "/notifications",
          },
        ].map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Module
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <div className="mt-5 text-sm font-medium text-slate-900">
              Open workspace
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
