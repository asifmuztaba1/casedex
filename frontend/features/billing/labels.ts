type Translate = (key: string) => string;

const PLAN_TITLE_KEYS: Record<string, string> = {
  trial: "billing.plan.trial",
  starter: "pricing.free.title",
  professional: "pricing.pro.title",
  chambers: "pricing.chambers.title",
};

function humanize(value: string): string {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Display name for a plan id, e.g. "professional" -> "Practice". */
export function planLabel(t: Translate, plan: string | null | undefined): string {
  const key = PLAN_TITLE_KEYS[plan ?? "trial"];
  return key ? t(key) : humanize(plan ?? "trial");
}

/** Readable label for subscription, payment, and change-request statuses. */
export function billingStatusLabel(t: Translate, status: string | null | undefined): string {
  if (!status) return "—";
  const key = `billing.status.${status}`;
  const label = t(key);
  return label === key ? humanize(status) : label;
}
