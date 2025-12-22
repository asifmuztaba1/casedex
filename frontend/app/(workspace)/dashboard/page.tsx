import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Filter, Search } from "lucide-react";

const hearings = [
  {
    date: "Jan 28, 2026 9:30 AM",
    caseName: "Patel v. State",
    casePublicId: "case-demo-01",
    type: "Motion",
    nextStep: "Prepare brief",
  },
  {
    date: "Feb 02, 2026 11:00 AM",
    caseName: "Rivera Holdings",
    casePublicId: "case-demo-02",
    type: "Status",
    nextStep: "Upload order sheet",
  },
  {
    date: "Feb 10, 2026 2:00 PM",
    caseName: "Northbridge Estates",
    casePublicId: "case-demo-03",
    type: "Hearing",
    nextStep: "Confirm witness list",
  },
];

const documents = [
  {
    name: "Order sheet",
    caseName: "Patel v. State",
    casePublicId: "case-demo-01",
    type: "Court order",
    updated: "Jan 23, 2026",
  },
  {
    name: "Evidence bundle",
    caseName: "Rivera Holdings",
    casePublicId: "case-demo-02",
    type: "Exhibit",
    updated: "Jan 22, 2026",
  },
  {
    name: "Hearing transcript",
    caseName: "Northbridge Estates",
    casePublicId: "case-demo-03",
    type: "Transcript",
    updated: "Jan 20, 2026",
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Review cases, hearings, diary entries, and notifications in one
            place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="subtle">Tenant: Demo</Badge>
          <Button size="sm" asChild>
            <a href="/cases">New case</a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cases", value: "24" },
          { label: "Upcoming hearings", value: "6" },
          { label: "Diary entries", value: "18" },
          { label: "Notifications", value: "3" },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              <CardTitle className="text-3xl font-semibold">
                {metric.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Upcoming hearings</CardTitle>
            <CardDescription>
              Next scheduled hearings with required follow-ups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Next step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hearings.map((hearing) => (
                  <TableRow key={hearing.date}>
                    <TableCell>{hearing.date}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/cases/${hearing.casePublicId}`}>
                          {hearing.caseName}
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell>{hearing.type}</TableCell>
                    <TableCell>{hearing.nextStep}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Today and next actions</CardTitle>
              <CardDescription>
                Focus areas for the next 48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Confirm witness list for Northbridge Estates",
                "Upload order sheet for Rivera Holdings",
                "Send diary summary to client",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent diary entries</CardTitle>
              <CardDescription>Latest notes added by the team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Filed reply and shared with team",
                  meta: "Patel v. State - Jan 24",
                },
                {
                  title: "Client check-in and evidence list",
                  meta: "Rivera Holdings - Jan 23",
                },
                {
                  title: "Reviewed witness statements",
                  meta: "Northbridge Estates - Jan 22",
                },
              ].map((entry) => (
                <div key={entry.title} className="space-y-1">
                  <div className="text-sm font-medium text-slate-900">
                    {entry.title}
                  </div>
                  <div className="text-xs text-slate-500">{entry.meta}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Recent documents</CardTitle>
              <CardDescription>
                Quick access to recently updated files.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="w-[220px] pl-9"
                  placeholder="Search documents"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Type
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>All types</DropdownMenuItem>
                  <DropdownMenuItem>Orders</DropdownMenuItem>
                  <DropdownMenuItem>Transcripts</DropdownMenuItem>
                  <DropdownMenuItem>Exhibits</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.name}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/cases/${doc.casePublicId}`}>
                        {doc.caseName}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{doc.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
