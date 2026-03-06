export type PlanId = "starter" | "professional" | "chambers";

export type PlanCatalogItem = {
  id: PlanId;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
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
    name: "Starter",
    monthlyPrice: "$19",
    yearlyPrice: "$190",
    storage: "1 GB storage",
    summary: "For solo advocates and early teams",
    bestFor: "Solo or early-stage teams",
    auditExport: false,
    prioritySupport: false,
    accent: "slate",
    features: [
      "Unlimited cases",
      "Unlimited team members",
      "All file types",
      "Standard support",
      "Simple setup",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: "$49",
    yearlyPrice: "$490",
    storage: "5 GB storage",
    summary: "For active firms handling larger dockets",
    badge: "Most selected",
    bestFor: "Growing firms with regular filings",
    auditExport: true,
    prioritySupport: false,
    accent: "indigo",
    features: [
      "Everything in Starter",
      "Audit export",
      "Expanded document capacity",
      "Team-friendly operations",
    ],
  },
  {
    id: "chambers",
    name: "Chambers",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    storage: "10 GB storage",
    summary: "For multi-team chambers and legal groups",
    bestFor: "Multi-team chambers and legal groups",
    auditExport: true,
    prioritySupport: true,
    accent: "teal",
    features: [
      "Everything in Professional",
      "Priority support",
      "Highest included storage",
      "Top-tier service level",
    ],
  },
];

export const STORAGE_ADDON_FEATURES = [
  "Add-on: unlimited storage",
  "Available on any plan",
  "Purchased separately",
];
