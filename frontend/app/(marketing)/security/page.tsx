import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Security",
  description: "Security practices for CaseDex.",
};

export default function SecurityPage() {
  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">Security</Badge>
          <CardTitle className="text-2xl font-semibold">
            Security and compliance
          </CardTitle>
          <CardDescription>
            CaseDex uses tenant isolation, audit logs, and signed downloads to
            safeguard sensitive legal information.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Tenant isolation",
            description:
              "Every query is scoped to tenant_id with policies enforcing ownership.",
          },
          {
            title: "Audit logging",
            description:
              "Key actions like login, case updates, and document changes are logged.",
          },
          {
            title: "Signed access",
            description:
              "Document downloads use signed URLs to prevent unauthorized access.",
          },
          {
            title: "Rate limits",
            description:
              "Authentication endpoints are rate-limited for added protection.",
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <CardHeader className="space-y-3">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
