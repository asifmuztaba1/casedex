import type { Metadata } from "next";

import PricingPageClient from "@/app/(marketing)/pricing/PricingPageClient";

export const metadata: Metadata = {
  title: "CaseDex Pricing",
  description: "Transparent plans for legal teams, chambers, and students.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
