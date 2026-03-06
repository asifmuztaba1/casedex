export type PlanTier = "trial" | "starter" | "professional" | "chambers";

export type BillingInterval = "monthly" | "yearly";
export type BillingSource = "lemon" | "manual_mfs" | "none";
export type ManualPaymentStatus = "pending" | "approved" | "rejected" | "expired";

export type SubscriptionStatus =
  | "active"
  | "on_trial"
  | "pending"
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
  has_active_subscription?: boolean;
  plan: PlanTier;
  on_trial: boolean;
  has_access: boolean;
  trial_ends_at: string | null;
  on_grace_period: boolean;
  renews_at: string | null;
  ends_at: string | null;
  variant_id: string | null;
  product_id: string | null;
  billing_source: BillingSource;
  manual_status: ManualPaymentStatus | null;
  temporary_access_expires_at: string | null;
  plan_limits: PlanLimits;
  ai_wallet?: AiWalletSummary;
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

export type ManualPaymentMethod = {
  public_id: string;
  channel: "bkash" | "rocket";
  account_name: string | null;
  receiver_number: string;
  instructions_en: string | null;
  instructions_bn: string | null;
  active: boolean;
  sort_order: number;
};

export type ManualMethodsResponse = {
  enabled: boolean;
  currency: string;
  methods: ManualPaymentMethod[];
  prices: Record<Exclude<PlanTier, "trial">, Record<BillingInterval, number | null>>;
  temporary_access_hours: number;
};

export type ManualPaymentRequest = {
  public_id: string;
  tenant_public_id?: string | null;
  tenant_name?: string | null;
  user_public_id?: string | null;
  user_name?: string | null;
  plan: Exclude<PlanTier, "trial">;
  interval: BillingInterval;
  amount: number;
  currency: string;
  sender_number: string;
  transaction_id: string;
  sent_at: string;
  status: ManualPaymentStatus;
  temporary_access_expires_at: string | null;
  approved_starts_at: string | null;
  approved_ends_at: string | null;
  reviewed_by_public_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  screenshot_download_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AiCreditPack = {
  public_id: string;
  code: string;
  name: string;
  credits: number;
  price_usd_cents: number;
  price_bdt: number;
  active: boolean;
  sort_order: number;
};

export type AiAlertRule = {
  public_id: string;
  threshold_credits: number;
  channel_in_app: boolean;
  channel_email: boolean;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AiWalletSummary = {
  free_balance: number;
  paid_balance: number;
  total_balance: number;
  monthly_free_credits: number;
  cycle_starts_at: string | null;
  cycle_ends_at: string | null;
  next_free_grant_at: string | null;
  pack_catalog: AiCreditPack[];
  alert_rules: AiAlertRule[];
};

export type AiLedgerEvent = {
  public_id: string;
  user_id: string | null;
  user_name: string | null;
  event_type: string;
  feature: string | null;
  credits_delta: number;
  free_delta: number;
  paid_delta: number;
  free_balance_after: number;
  paid_balance_after: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type AiManualPaymentRequest = {
  public_id: string;
  status: ManualPaymentStatus;
  amount: number;
  currency: string;
  sender_number: string;
  transaction_id: string;
  sent_at: string;
  rejection_reason: string | null;
  screenshot_download_url?: string | null;
  pack?: {
    public_id: string;
    code: string;
    name: string;
    credits: number;
  } | null;
};
