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
    name: "Starter",
    monthlyPrice: "$19",
    yearlyPrice: "$190",
    monthlyPriceBdt: "\u09F31,900",
    yearlyPriceBdt: "\u09F319,000",
    storage: "1 GB storage",
    summary: "For solo advocates starting out",
    bestFor: "Solo advocates or small practices",
    auditExport: false,
    prioritySupport: false,
    accent: "slate",
    features: [
      "Unlimited cases & team members",
      "Hearing timeline & diary tracking",
      "Document uploads with signed links",
      "Client & contacts directory",
      "100 AI credits/month",
      "Push notification reminders",
      "Bangladesh court registry",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: "$49",
    yearlyPrice: "$490",
    monthlyPriceBdt: "\u09F34,900",
    yearlyPriceBdt: "\u09F349,000",
    storage: "5 GB storage",
    summary: "For active firms with regular filings",
    badge: "Most selected",
    bestFor: "Growing firms with multiple advocates",
    auditExport: true,
    prioritySupport: false,
    accent: "indigo",
    features: [
      "Everything in Starter",
      "5x storage for larger case files",
      "Audit export (CSV) for compliance",
      "100 AI credits/month",
    ],
  },
  {
    id: "chambers",
    name: "Chambers",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    monthlyPriceBdt: "\u09F39,900",
    yearlyPriceBdt: "\u09F399,000",
    storage: "10 GB storage",
    summary: "For established chambers and legal groups",
    bestFor: "Multi-advocate chambers & legal departments",
    auditExport: true,
    prioritySupport: true,
    accent: "teal",
    features: [
      "Everything in Professional",
      "10 GB storage for extensive archives",
      "Priority email support",
      "100 AI credits/month",
    ],
  },
];

export const STORAGE_ADDON_FEATURES = [
  "Add-on: unlimited storage",
  "Available on any plan",
  "Purchased separately",
];
