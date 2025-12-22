import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy practices for CaseDex.",
};

export default function PrivacyPage() {
  return (
    <section className="space-y-10">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">Privacy</Badge>
          <CardTitle className="text-2xl font-semibold">
            Privacy policy
          </CardTitle>
          <CardDescription>
            CaseDex is built to protect confidential legal work. This policy
            will be updated with detailed practices before launch.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Data collection",
            description:
              "We collect only what is needed to operate the workspace and improve reliability.",
          },
          {
            title: "Tenant boundaries",
            description:
              "Data is isolated per tenant and available only to authorized users.",
          },
          {
            title: "No resale",
            description: "We do not sell personal information or client records.",
          },
          {
            title: "Security controls",
            description:
              "Signed downloads and audit logs support accountability.",
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
