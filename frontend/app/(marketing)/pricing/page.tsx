import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "CaseDex Pricing",
  description: "Transparent plans for legal teams, chambers, and students.",
};

export default function PricingPage() {
  return (
    <section className="space-y-12">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="subtle">Pricing</Badge>
          <CardTitle className="text-2xl font-semibold">
            Transparent plans for growing legal teams
          </CardTitle>
          <CardDescription>
            Start with the free plan and upgrade when you need more storage and
            advanced file types.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Free",
            description: "Up to 5 cases per tenant. PDF/JPG/PNG uploads.",
          },
          {
            title: "Professional",
            description: "Expanded storage, advanced file types, and audit packs.",
          },
          {
            title: "Chambers",
            description: "Multi-team controls, priority support, and SLAs.",
          },
        ].map((tier) => (
          <Card key={tier.title} className="h-full">
            <CardHeader className="space-y-3">
              <CardTitle className="text-base">{tier.title}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <Button variant="outline" size="sm" asChild>
                <a href="/login">Request access</a>
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
