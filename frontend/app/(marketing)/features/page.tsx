import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, CalendarClock, FileText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "CaseDex Features",
  description:
    "Explore cases, hearings, diary entries, documents, research notes, and notifications in a structured workspace.",
};

const featureBlocks = [
  {
    title: "Case workspace",
    description:
      "Every record is anchored to the case so the team sees the full history.",
    icon: BookOpen,
  },
  {
    title: "Hearing timelines",
    description: "Track dates, agendas, outcomes, and next steps in one view.",
    icon: CalendarClock,
  },
  {
    title: "Document metadata",
    description:
      "Keep uploads searchable with categories, source context, and links.",
    icon: FileText,
  },
  {
    title: "Trust and controls",
    description:
      "Tenant isolation, signed downloads, and audit trails protect records.",
    icon: ShieldCheck,
  },
];

export default function FeaturesPage() {
  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">Features</Badge>
          <CardTitle className="text-2xl font-semibold">
            Every module mapped to the legal workflow
          </CardTitle>
          <CardDescription>
            CaseDex keeps your workspace structured so teams can move quickly
            without losing context.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {featureBlocks.map((feature) => (
          <Card key={feature.title} className="h-full">
            <CardHeader className="space-y-3">
              <feature.icon className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Case intake",
            description:
              "Capture the client record, case story, and petition draft with structured prompts.",
          },
          {
            title: "Hearings + minutes",
            description:
              "Store agendas, outcome notes, and next steps with editable summaries.",
          },
          {
            title: "Team coordination",
            description:
              "Add participants per case with roles and keep notifications aligned.",
          },
        ].map((feature) => (
          <Card key={feature.title} className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
