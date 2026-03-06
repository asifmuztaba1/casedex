export type PlanId = "starter" | "professional" | "chambers";

export type PlanCatalogItem = {
  id: PlanId;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  storage: string;
  summary: string;
  badge?: string;
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
    features: [
      "Unlimited cases",
      "Unlimited team members",
      "All file types",
      "30-day trial included",
      "Monthly or yearly billing",
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
    features: [
      "Everything in Starter",
      "Audit export",
      "Higher storage capacity",
      "Unlimited cases and team members",
      "Monthly or yearly billing",
    ],
  },
  {
    id: "chambers",
    name: "Chambers",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    storage: "10 GB storage",
    summary: "For multi-team chambers and legal groups",
    features: [
      "Everything in Professional",
      "Priority support",
      "Highest included storage",
      "Unlimited cases and team members",
      "Monthly or yearly billing",
    ],
  },
];

export const STORAGE_ADDON_FEATURES = [
  "Add-on: unlimited storage",
  "Available on any plan",
  "Purchased separately",
];
