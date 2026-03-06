export type PlanTier = "trial" | "starter" | "professional" | "chambers";

export type BillingInterval = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "on_trial"
  | "paused"
  | "past_due"
  | "canceled"
  | "cancelled"
  | "expired";

export type PlanLimits = {
  storage_limit_bytes: number | null;
  storage_used_bytes: number;
  storage_remaining_bytes: number | null;
  has_unlimited_storage: boolean;
  has_audit_export: boolean;
  has_priority_support: boolean;
};

export type SubscriptionState = {
  status: SubscriptionStatus;
  plan: PlanTier;
  on_trial: boolean;
  trial_ends_at: string | null;
  on_grace_period: boolean;
  renews_at: string | null;
  ends_at: string | null;
  variant_id: string | null;
  product_id: string | null;
  plan_limits: PlanLimits;
};

export type BillingInvoice = {
  id: number;
  identifier: string;
  order_number: number;
  currency: string;
  total: number;
  status: string;
  receipt_url: string | null;
  ordered_at: string;
};
