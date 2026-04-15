export type PlanId = "starter" | "professional" | "chambers";

export type PlanCatalogItem = {
  id: PlanId;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPriceBdt: string;
  yearlyPriceBdt: string;
  storage: string;
  summary: string;
  badge?: string;
  bestFor: string;
  auditExport: boolean;
  prioritySupport: boolean;
  accent: "slate" | "indigo" | "teal";
  features: string[];
};

export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    id: "starter",
    name: "Solo",
    monthlyPrice: "$19",
    yearlyPrice: "$190",
    monthlyPriceBdt: "\u09F3500",
    yearlyPriceBdt: "\u09F35,000",
    storage: "2 GB storage",
    summary: "For solo advocates just getting started",
    bestFor: "A single advocate running their own practice",
    auditExport: false,
    prioritySupport: false,
    accent: "slate",
    features: [
      "1 user seat",
      "Unlimited cases, hearings & diary entries",
      "100 AI credits / month",
      "Cause list alerts for up to 10 active cases",
      "Daily morning briefing (WhatsApp + in-app)",
      "Voice assistant",
      "Bangladesh court registry",
      "Community support",
    ],
  },
  {
    id: "professional",
    name: "Practice",
    monthlyPrice: "$49",
    yearlyPrice: "$490",
    monthlyPriceBdt: "\u09F31,900",
    yearlyPriceBdt: "\u09F319,000",
    storage: "10 GB storage",
    summary: "For growing practices with regular filings",
    badge: "Most selected",
    bestFor: "Firms with 2-5 advocates filing weekly",
    auditExport: true,
    prioritySupport: false,
    accent: "indigo",
    features: [
      "Up to 5 user seats",
      "Everything in Solo",
      "300 AI credits / month",
      "Unlimited cause list alerts",
      "Bulk case import",
      "Audit export (CSV) for compliance",
      "Email support",
    ],
  },
  {
    id: "chambers",
    name: "Chambers",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    monthlyPriceBdt: "\u09F34,900",
    yearlyPriceBdt: "\u09F349,000",
    storage: "50 GB storage",
    summary: "For established chambers and legal groups",
    bestFor: "Multi-advocate chambers & in-house legal teams",
    auditExport: true,
    prioritySupport: true,
    accent: "teal",
    features: [
      "Unlimited user seats",
      "Everything in Practice",
      "1,000 AI credits / month",
      "Client portal",
      "SSO / SAML",
      "Priority email + WhatsApp support",
    ],
  },
];

export const STORAGE_ADDON_FEATURES = [
  "Add-on: unlimited storage",
  "Available on any plan",
  "Purchased separately",
];
