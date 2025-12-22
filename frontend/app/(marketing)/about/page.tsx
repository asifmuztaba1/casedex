import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About CaseDex",
  description:
    "CaseDex is a structured case workspace for legal professionals and law students.",
};

export default function AboutPage() {
  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">About</Badge>
          <CardTitle className="text-2xl font-semibold">
            Built for legal teams who value clarity
          </CardTitle>
          <CardDescription>
            CaseDex is a structured case workspace for legal professionals and law
            students. It keeps hearings, diaries, documents, and research in one
            place while supporting professional judgment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div>
            We focus on trust, calm workflows, and consistent structure. The
            workspace is intentionally neutral to reduce distraction and keep
            teams aligned.
          </div>
          <div>
            AI assistance is limited to summaries and organization, always
            editable and sources-first. CaseDex never offers legal advice.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Structured by design",
            description:
              "Each module mirrors real hearing and research workflows.",
          },
          {
            title: "AI-assisted summaries",
            description:
              "Summaries are editable, source-linked, and never replace judgment.",
          },
          {
            title: "Tenant isolation",
            description:
              "Multi-tenant protections keep every case scoped to its organization.",
          },
          {
            title: "Calm interfaces",
            description:
              "Neutral color and measured typography keep the workspace focused.",
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
