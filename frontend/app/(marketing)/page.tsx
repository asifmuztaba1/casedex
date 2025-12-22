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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <section className="space-y-16">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">Structured case workspace</Badge>
            <Badge variant="subtle">Sources-first summaries</Badge>
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Trustworthy legal workflow
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              A structured case workspace for legal professionals and students.
            </h1>
            <p className="text-base text-slate-600">
              CaseDex keeps cases, hearings, diary entries, documents, and
              research notes tied to one calm system. Maintain institutional
              memory without losing sources or context.
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
              <BookOpen className="h-4 w-4 text-slate-500" />
              AI assists, never decides
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              PWA-ready access
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="space-y-4 border-b border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Case workspace preview
                </p>
                <CardTitle className="text-lg">Patel v. State</CardTitle>
                <CardDescription>Motion hearing • Tomorrow 9:30 AM</CardDescription>
              </div>
              <Badge variant="subtle">Live view</Badge>
            </div>
            <Tabs defaultValue="hearings">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="hearings">Hearings</TabsTrigger>
                <TabsTrigger value="diary">Diary</TabsTrigger>
                <TabsTrigger value="docs">Docs</TabsTrigger>
                <TabsTrigger value="research">Research</TabsTrigger>
              </TabsList>
              <TabsContent value="hearings" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Next step</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        date: "Tomorrow 9:30 AM",
                        type: "Motion",
                        next: "Prepare brief",
                      },
                      {
                        date: "Feb 12, 2026",
                        type: "Status",
                        next: "Upload order sheet",
                      },
                    ].map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.next}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="diary" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        date: "Jan 24",
                        entry: "Filed reply and shared with team",
                        owner: "Senior associate",
                      },
                      {
                        date: "Jan 21",
                        entry: "Client check-in and evidence list",
                        owner: "Paralegal",
                      },
                    ].map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.entry}</TableCell>
                        <TableCell>{row.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="docs" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        name: "Order sheet",
                        type: "Court order",
                        status: "Signed link",
                      },
                      {
                        name: "Evidence bundle",
                        type: "Exhibit",
                        status: "Indexed",
                      },
                    ].map((row) => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="research" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Note</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Tag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        note: "Key precedent summary ready",
                        source: "Case law",
                        tag: "Cited",
                      },
                      {
                        note: "Draft argument outline",
                        source: "Internal",
                        tag: "Review",
                      },
                    ].map((row) => (
                      <TableRow key={row.note}>
                        <TableCell>{row.note}</TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>{row.tag}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tomorrow reminder
                </p>
                <p className="text-sm text-slate-900">
                  Motion hearing at 9:30 AM
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Summary panel
                </p>
                <p className="text-sm text-slate-700">
                  AI-assisted summaries stay editable and sourced.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: "Case workspace",
            description: "Everything tied to a case stays in one view.",
          },
          {
            icon: Bell,
            title: "Hearings and reminders",
            description: "Never miss dates, outcomes, or next steps.",
          },
          {
            icon: FileText,
            title: "Diary and summaries",
            description: "Structured memory with editable summaries.",
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
          <p className="text-sm uppercase tracking-wide text-slate-500">
            How it works
          </p>
          <CardTitle className="text-2xl font-semibold">
            Build the case record once, reuse everywhere.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Create a case",
              description: "Start with the client record and case basics.",
            },
            {
              step: "02",
              title: "Add hearings and documents",
              description: "Track dates, upload orders, and capture notes.",
            },
            {
              step: "03",
              title: "Summarize and plan",
              description: "Generate summaries, keep sources, and assign tasks.",
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

      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            title: "Advocates",
            copy: "Keep hearings and filings on a single timeline.",
          },
          {
            title: "Chambers assistants",
            copy: "Track updates without chasing documents.",
          },
          {
            title: "Law students",
            copy: "Organize notes and research in context.",
          },
          {
            title: "Legal teams",
            copy: "Coordinate tasks with shared visibility.",
          },
        ].map((persona) => (
          <Card key={persona.title} className="h-full">
            <CardHeader className="space-y-2">
              <Users className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">{persona.title}</CardTitle>
              <CardDescription>{persona.copy}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-slate-500">
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
            <p className="text-sm uppercase tracking-wide text-slate-500">
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
