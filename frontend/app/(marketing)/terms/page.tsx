import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for CaseDex.",
};

export default function TermsPage() {
  return (
    <section className="space-y-10">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">Terms</Badge>
          <CardTitle className="text-2xl font-semibold">
            Terms of service
          </CardTitle>
          <CardDescription>
            These terms are a placeholder and will be finalized before launch.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "No legal advice",
            description:
              "CaseDex provides a structured case workspace and does not offer legal advice.",
          },
          {
            title: "User responsibility",
            description:
              "Users are responsible for the accuracy of entries and compliance with obligations.",
          },
          {
            title: "AI assistance",
            description:
              "AI output is editable, sources-first, and never a substitute for judgment.",
          },
          {
            title: "Account access",
            description:
              "Access is limited to authorized users within each tenant.",
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
