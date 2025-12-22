import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const signalCards = [
  {
    label: "Tomorrow 9:30 AM",
    title: "Motion hearing",
    meta: "Patel v. State",
  },
  {
    label: "Jan 24, 2026",
    title: "Diary entry",
    meta: "Filed reply and shared",
  },
  {
    label: "Jan 21, 2026",
    title: "Order sheet uploaded",
    meta: "Court order - Signed link",
  },
  {
    label: "Jan 18, 2026",
    title: "Research note",
    meta: "Precedent summary ready",
  },
];

export default function Home() {
  return (
    <section className="space-y-24">
      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">Structured case workspace</Badge>
            <Badge variant="subtle">Sources-first summaries</Badge>
          </div>
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              CaseDex
            </p>
            <h1 className="text-5xl font-semibold leading-tight text-slate-900 md:text-6xl">
              The case workspace that keeps legal teams calm and prepared.
            </h1>
            <p className="text-lg text-slate-600">
              CaseDex is a structured case workspace for legal professionals and
              law students. Track hearings, diary entries, and documents with a
              clear, consistent record that never loses context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <a href="/login" className="inline-flex items-center gap-2">
                Start free
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/features">See demo</a>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <a href="/login">Log in</a>
            </Button>
          </div>
          <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              Tenant isolation by default
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              AI assists, never decides
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              PWA-ready access
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {signalCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {card.label}
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {card.title}
              </div>
              <div className="text-xs text-slate-500">{card.meta}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            CaseDex keeps AI output clearly labeled, editable, and tied to
            sources.
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Workspace signal
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            One case record, shared across every module.
          </h2>
          <p className="text-sm text-slate-600">
            Hearings, diary entries, and documents stay connected to the case.
            Everyone sees the same timeline, the same sources, and the same next
            steps.
          </p>
          <div className="grid gap-3">
            {[
              "Case intake and story",
              "Hearing minutes and outcomes",
              "Document metadata and downloads",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Case workspace preview
                </p>
                <CardTitle className="text-xl">Patel v. State</CardTitle>
                <CardDescription>
                  Hearings, diary entries, and documents in one place.
                </CardDescription>
              </div>
              <Badge variant="subtle">Live view</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 py-6">
            {[
              {
                title: "Next hearing",
                body: "Motion hearing - Tomorrow 9:30 AM",
                icon: CalendarClock,
              },
              {
                title: "Diary focus",
                body: "Prepare brief and confirm witness list",
                icon: FileText,
              },
              {
                title: "Recent document",
                body: "Order sheet uploaded - Signed link",
                icon: FileText,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <item.icon className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.title}
                  </div>
                  <div className="text-sm text-slate-900">{item.body}</div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
              AI-assisted summaries are clearly labeled and always editable.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Case workspace",
            description:
              "Every document, note, and hearing anchored to the case.",
            icon: FileText,
          },
          {
            title: "Hearing timelines",
            description:
              "Track agendas, minutes, outcomes, and next steps without noise.",
            icon: CalendarClock,
          },
          {
            title: "Team coordination",
            description:
              "Add participants per case with roles and clear accountability.",
            icon: Users,
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <CardHeader className="space-y-3">
              <item.icon className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            Workflow
          </p>
          <CardTitle className="text-2xl font-semibold">
            Everything starts with the case.
          </CardTitle>
          <CardDescription>
            Case intake drives hearings, diary entries, documents, and
            notifications. Nothing is orphaned.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Intake and client",
              description:
                "Capture client details, story notes, and petition drafts.",
            },
            {
              step: "02",
              title: "Hearings and diary",
              description:
                "Record agendas, minutes, and diary entries linked to hearings.",
            },
            {
              step: "03",
              title: "Documents and alerts",
              description:
                "Store filings and notify participants before key dates.",
            },
          ].map((item) => (
            <div key={item.step} className="space-y-3">
              <Badge variant="subtle">Step {item.step}</Badge>
              <div className="text-base font-semibold text-slate-900">
                {item.title}
              </div>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            Trust and security
          </p>
          <CardTitle className="text-2xl font-semibold">
            Designed for legal confidentiality.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            "Tenant isolation on every record",
            "Signed document links and audit logs",
            "AI assists but never decides",
            "Clear, editable summaries with sources",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
              Ready to start
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Book a demo or request access.
            </h2>
            <p className="text-sm text-slate-600">
              We will follow up with onboarding steps and a guided walkthrough.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input placeholder="Work email" type="email" />
            <Button>Book a demo</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}