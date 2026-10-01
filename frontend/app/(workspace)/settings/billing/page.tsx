"use client";

import { useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useSearchParams } from "next/navigation";
import AiIcon from "@/components/ai-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StorageMeter from "@/components/storage-meter";
import PlanTierCard from "@/components/plan-tier-card";
import {
  useAiCreditCheckout,
  useAiCredits,
  useAiLedger,
  useAiMfsRequestStatus,
  useSubmitAiMfsRequest,
  useBillingPortal,
  useCancelSubscription,
  useChangePlan,
  useCheckout,
  useInvoices,
  useManualMethods,
  useManualRequestStatus,
  useManualSubscriptionChangeStatus,
  useSubmitManualSubscriptionChange,
  useResumeSubscription,
  useSubmitManualRequest,
  useSubscription,
} from "@/features/billing/use-billing";
import type { BillingInterval } from "@/features/billing/types";
import { useLocale } from "@/components/locale-provider";
import { PLAN_CATALOG, STORAGE_ADDON_FEATURES, type PlanId } from "@/features/billing/plan-catalog";
import { useToast } from "@/components/ui/use-toast";
import { isManualMfsOnlyLaunch } from "@/lib/launch-config";
import { billingStatusLabel, planLabel } from "@/features/billing/labels";
import { useIsBdtPricing } from "@/lib/use-locale-currency";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Banknote,
  Brain,
  CalendarClock,
  CreditCard,
  FileClock,
  History,
  Package,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { formatDate } from "@/lib/date-format";

export default function BillingSettingsPage() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const manualOnlyLaunch = isManualMfsOnlyLaunch();
  const isBdt = useIsBdtPricing();
  const fromOnboarding = searchParams.get("onboarding") === "1";
  const preferManual = searchParams.get("source") === "manual";
  const initialInterval = searchParams.get("interval") === "yearly" ? "yearly" : "monthly";
  const planFromUrl = searchParams.get("plan");
  const isCatalogPlan = (value: string | null | undefined): value is PlanId =>
    PLAN_CATALOG.some((item) => item.id === value);
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  // null until the user picks; defaults to the ?plan= link, then the current plan.
  const [manualPlanChoice, setManualPlan] = useState<PlanId | null>(
    isCatalogPlan(planFromUrl) ? planFromUrl : null
  );
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [sentAt, setSentAt] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [selectedManualMethodPublicId, setSelectedManualMethodPublicId] = useState<string>("");
  const [paymentChoiceOpen, setPaymentChoiceOpen] = useState(false);
  const [pendingPlanChoice, setPendingPlanChoice] = useState<PlanId | null>(null);
  const manualSectionRef = useRef<HTMLDivElement | null>(null);
  const aiManualSectionRef = useRef<HTMLDivElement | null>(null);
  const [sectionTab, setSectionTab] = useState<"plans" | "manual" | "ai" | "invoices">(preferManual ? "manual" : "plans");
  const { data: subscription } = useSubscription();
  const manualPlan: PlanId =
    manualPlanChoice ?? (isCatalogPlan(subscription?.plan) ? subscription.plan : "professional");
  const { data: invoices = [] } = useInvoices();
  const { data: manualMethods } = useManualMethods();
  const { data: manualRequestStatus } = useManualRequestStatus();
  const { data: manualChangeStatus } = useManualSubscriptionChangeStatus();
  const { data: aiCredits } = useAiCredits();
  const { data: aiLedger = [] } = useAiLedger();
  const { data: aiMfsStatus } = useAiMfsRequestStatus();
  const checkout = useCheckout();
  const aiCheckout = useAiCreditCheckout();
  const submitAiMfsRequest = useSubmitAiMfsRequest();
  const changePlan = useChangePlan();
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();
  const portal = useBillingPortal();
  const submitManualRequest = useSubmitManualRequest();
  const submitManualSubscriptionChange = useSubmitManualSubscriptionChange();
  const { toast } = useToast();
  const [selectedAiPackId, setSelectedAiPackId] = useState<string>("");
  const [aiSenderNumber, setAiSenderNumber] = useState("");
  const [aiTransactionId, setAiTransactionId] = useState("");
  const [aiSentAt, setAiSentAt] = useState("");
  const [aiScreenshot, setAiScreenshot] = useState<File | null>(null);
  const [manualLifecycleType, setManualLifecycleType] = useState<"cancel" | "plan_change">("cancel");
  const [manualLifecyclePlan, setManualLifecyclePlan] = useState<PlanId>("starter");
  const [manualLifecycleInterval, setManualLifecycleInterval] = useState<BillingInterval>("monthly");
  const [manualLifecycleEffectiveAt, setManualLifecycleEffectiveAt] = useState("");

  const trialText = subscription?.trial_ends_at
    ? formatDistanceToNowStrict(new Date(subscription.trial_ends_at), {
        addSuffix: true,
      })
    : null;
  const temporaryAccessText = manualRequestStatus?.temporary_access_expires_at
    ? formatDistanceToNowStrict(new Date(manualRequestStatus.temporary_access_expires_at), {
        addSuffix: true,
      })
    : null;
  const paidEndsAt =
    manualRequestStatus?.status === "approved" && manualRequestStatus.approved_ends_at
      ? new Date(manualRequestStatus.approved_ends_at)
      : null;
  const paidUntil = paidEndsAt ? formatDate(paidEndsAt, "PP", locale) : null;
  const paidAccessEnded = paidEndsAt !== null && subscription?.has_access === false;
  const manualEnabled = Boolean(manualMethods?.enabled);
  const activeSectionTab = !manualEnabled && sectionTab === "manual" ? "plans" : sectionTab;
  const manualCanSubmitNow = manualMethods?.can_submit_now ?? true;
  const expectedAmount = manualMethods?.prices?.[manualPlan]?.[interval] ?? null;
  const activeManualMethodId =
    selectedManualMethodPublicId !== "" && manualMethods?.methods?.some((method) => method.public_id === selectedManualMethodPublicId)
      ? selectedManualMethodPublicId
      : manualMethods?.methods?.[0]?.public_id ?? "";
  const selectedManualMethod =
    manualMethods?.methods?.find((method) => method.public_id === activeManualMethodId) ?? null;
  const activeAiPackId =
    selectedAiPackId !== "" && aiCredits?.pack_catalog?.some((pack) => pack.public_id === selectedAiPackId)
      ? selectedAiPackId
      : aiCredits?.pack_catalog?.[0]?.public_id ?? "";
  const selectedAiPack =
    aiCredits?.pack_catalog?.find((pack) => pack.public_id === activeAiPackId) ?? null;

  const scrollToManualSection = () => {
    setSectionTab("manual");
    window.requestAnimationFrame(() => {
      manualSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const startCardCheckout = async (plan: PlanId) => {
    try {
      const response = await checkout.mutateAsync({ plan, interval });
      if (response.checkout_url) {
        window.location.assign(response.checkout_url);
      }
    } catch (error) {
      toast({
        title: t("billing.ui.update_failed"),
        description: error instanceof Error ? error.message : t("billing.ui.update_error"),
        variant: "error",
      });
    }
  };

  const chooseManualPayment = (plan: PlanId) => {
    setManualPlan(plan);
    setPaymentChoiceOpen(false);
    scrollToManualSection();
    toast({
      title: manualOnlyLaunch ? t("billing.ui.mfs_billing_selected") : t("billing.ui.mfs_selected"),
      description: manualOnlyLaunch
        ? t("billing.ui.beta_uses_mfs")
        : t("billing.ui.complete_details_below"),
    });
  };

  const onSelectPlan = async (plan: PlanId) => {
    setManualPlan(plan);

    try {
      if (manualOnlyLaunch) {
        if (!manualEnabled) {
          toast({
            title: t("billing.ui.mfs_unavailable"),
            description: t("billing.ui.mfs_not_configured"),
            variant: "error",
          });
          return;
        }

        if (subscription?.billing_source === "manual_mfs" && subscription.status && subscription.status !== "expired" && !subscription.on_trial) {
          setManualLifecycleType("plan_change");
          setManualLifecyclePlan(plan);
          setManualLifecycleInterval(interval);
          scrollToManualSection();
          toast({
            title: t("billing.ui.plan_change_prepared"),
            description: t("billing.ui.review_update_form"),
          });
          return;
        }

        chooseManualPayment(plan);
        return;
      }

      const isLemonManaged = subscription?.billing_source === "lemon";

      if (!subscription || !isLemonManaged || subscription.status === "expired" || subscription.on_trial) {
        if (manualEnabled) {
          setPendingPlanChoice(plan);
          setPaymentChoiceOpen(true);
          return;
        }

        await startCardCheckout(plan);
        return;
      }

      await changePlan.mutateAsync({ plan, interval });
    } catch (error) {
      toast({
        title: t("billing.ui.update_failed"),
        description: error instanceof Error ? error.message : t("billing.ui.update_error"),
        variant: "error",
      });
    }
  };

  const onSubmitManual = async () => {
      if (!manualCanSubmitNow) {
        toast({
          title: t("billing.ui.payment_not_needed"),
          description: t("billing.ui.submit_after_trial"),
          variant: "error",
        });
        return;
      }

      if (!selectedManualMethod || !expectedAmount || !senderNumber || !transactionId || !sentAt || !screenshot) {
        toast({
          title: t("billing.ui.payment_details_required"),
          description: t("billing.ui.fill_all_with_channel"),
          variant: "error",
        });
        return;
    }

    try {
      const sentAtIso = new Date(sentAt).toISOString();
      await submitManualRequest.mutateAsync({
        plan: manualPlan,
        interval,
        amount: expectedAmount,
        sender_number: senderNumber,
        channel: selectedManualMethod.channel,
        transaction_id: transactionId,
        sent_at: sentAtIso,
        screenshot,
      });

      toast({
        title: t("billing.ui.details_received"),
        description: t("billing.ui.workspace_available_during_review"),
      });

      setSenderNumber("");
      setTransactionId("");
      setSentAt("");
      setScreenshot(null);
    } catch (error) {
      toast({
        title: t("billing.ui.submission_failed"),
        description: error instanceof Error ? error.message : t("billing.ui.submit_error"),
        variant: "error",
      });
    }
  };

  const startAiCheckout = async () => {
    if (!selectedAiPack) {
      toast({
        title: t("billing.ui.select_ai_pack"),
        description: t("billing.ui.choose_pack"),
        variant: "error",
      });
      return;
    }

    try {
      const response = await aiCheckout.mutateAsync({ pack_public_id: selectedAiPack.public_id });
      if (response.checkout_url) {
        window.location.assign(response.checkout_url);
      }
    } catch (error) {
      toast({
        title: t("billing.ui.ai_topup_failed"),
        description: error instanceof Error ? error.message : t("billing.ui.checkout_error"),
        variant: "error",
      });
    }
  };

  const onSubmitAiManual = async () => {
    if (!selectedAiPack || !aiSenderNumber || !aiTransactionId || !aiSentAt || !aiScreenshot) {
      toast({
        title: t("billing.ui.ai_topup_required"),
        description: t("billing.ui.fill_all"),
        variant: "error",
      });
      return;
    }

    try {
      await submitAiMfsRequest.mutateAsync({
        pack_public_id: selectedAiPack.public_id,
        amount: selectedAiPack.price_bdt,
        sender_number: aiSenderNumber,
        transaction_id: aiTransactionId,
        sent_at: new Date(aiSentAt).toISOString(),
        screenshot: aiScreenshot,
      });

      setAiSenderNumber("");
      setAiTransactionId("");
      setAiSentAt("");
      setAiScreenshot(null);

      toast({
        title: t("billing.ui.ai_topup_received"),
        description: t("billing.ui.ai_request_reviewing"),
      });
    } catch (error) {
      toast({
        title: t("billing.ui.ai_topup_submit_failed"),
        description: error instanceof Error ? error.message : t("billing.ui.ai_payment_error"),
        variant: "error",
      });
    }
  };

  const onSubmitManualLifecycle = async () => {
    if (!manualLifecycleEffectiveAt) {
      toast({
        title: t("billing.ui.effective_date_required"),
        description: t("billing.ui.choose_effective_date"),
        variant: "error",
      });
      return;
    }

    try {
      await submitManualSubscriptionChange.mutateAsync({
        type: manualLifecycleType,
        requested_plan: manualLifecycleType === "plan_change" ? manualLifecyclePlan : undefined,
        requested_interval: manualLifecycleType === "plan_change" ? manualLifecycleInterval : undefined,
        effective_at: new Date(manualLifecycleEffectiveAt).toISOString(),
      });

      toast({
        title: t("billing.ui.request_submitted"),
        description: t("billing.ui.team_will_review_update"),
      });
    } catch (error) {
      toast({
        title: t("billing.ui.request_failed"),
        description: error instanceof Error ? error.message : t("billing.ui.submit_error"),
        variant: "error",
      });
    }
  };

  const isLemonBilling = subscription?.billing_source === "lemon";
  const canManageLemonSubscription = isLemonBilling && Boolean(subscription?.status && subscription.status !== "expired");
  const trialEndsOn = manualMethods?.trial_ends_at ? formatDate(manualMethods.trial_ends_at, "PP", locale) : null;
  const billingRouteLabel = manualOnlyLaunch
    ? t("billing.ui.mfs_beta_flow")
    : isLemonBilling
      ? t("billing.ui.card_billing")
      : manualEnabled
        ? t("billing.ui.mfs_available")
        : t("billing.ui.trial_access");
  const nextStepLabel = manualRequestStatus?.status === "pending"
    ? t("billing.ui.next_review")
    : paidUntil
      ? paidAccessEnded
        ? t("billing.renew_to_restore")
        : `${t("billing.renew_by")} ${paidUntil}`
    : !manualCanSubmitNow
      ? `${t("billing.ui.share_after_trial")}${trialEndsOn ? ` (${trialEndsOn})` : ""}`
      : manualOnlyLaunch
        ? t("billing.ui.next_choose_plan")
        : canManageLemonSubscription
          ? t("billing.ui.next_manage")
          : t("billing.ui.next_pick_plan");

  return (
    <section className="space-y-6">
      {fromOnboarding && (
        <Card className="border-[var(--border)] bg-[var(--wash)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-emerald-700" />{t("billing.onboarding_title")}</CardTitle>
            <CardDescription>
              {manualOnlyLaunch
                ? subscription?.status === "expired"
                  ? t("billing.onboarding_desc_manual_expired")
                  : t("billing.onboarding_desc_manual_trial")
                : t("billing.onboarding_desc")}
            </CardDescription>
            {preferManual && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                {t("billing.ui.mfs_selected_at_registration")}
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-[var(--muted)]" />{t("billing.title")}</CardTitle>
          <CardDescription>
            {manualOnlyLaunch
              ? t("billing.ui.private_beta_desc")
              : t("billing.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{planLabel(t, subscription?.plan)}</Badge>
            <Badge>{billingStatusLabel(t, subscription?.status ?? "on_trial")}</Badge>
            {subscription?.billing_source === "manual_mfs" && (
              <Badge>{t("billing.ui.mfs")}</Badge>
            )}
            {paidUntil ? (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-soft)]"><CalendarClock className="h-3.5 w-3.5" />{t("billing.paid_until")}: {paidUntil}</span>
            ) : (
              trialText && <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-soft)]"><CalendarClock className="h-3.5 w-3.5" />{t("billing.trial_ends")}: {trialText}</span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.current_plan")}</div>
              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{planLabel(t, subscription?.plan)}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.billing_route")}</div>
              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{billingRouteLabel}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.next_step")}</div>
              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{nextStepLabel}</div>
            </div>
          </div>
          {subscription?.plan_limits && (
            <StorageMeter
              usedBytes={subscription.plan_limits.storage_used_bytes}
              limitBytes={subscription.plan_limits.storage_limit_bytes}
              hasUnlimitedStorage={subscription.plan_limits.has_unlimited_storage}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {!manualOnlyLaunch && (
              <>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await portal.mutateAsync();
                      if (response.portal_url) {
                        window.location.assign(response.portal_url);
                      }
                    } catch (error) {
                      toast({
                        title: t("billing.ui.portal_unavailable"),
                        description: error instanceof Error ? error.message : t("billing.ui.portal_error"),
                        variant: "error",
                      });
                    }
                  }}
                  disabled={portal.isPending || !isLemonBilling}
                >
                  {t("billing.manage_portal")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => cancel.mutate()}
                  disabled={cancel.isPending || !canManageLemonSubscription}
                >
                  {t("billing.cancel")}
                </Button>
                <Button onClick={() => resume.mutate()} disabled={resume.isPending || !isLemonBilling}>
                  {t("billing.resume")}
                </Button>
              </>
            )}
            {manualEnabled && (
              <Button
                variant="outline"
                onClick={scrollToManualSection}
              >
                {manualOnlyLaunch ? t("billing.ui.open_payment_details") : t("billing.ui.open_mfs_billing")}
              </Button>
            )}
          </div>
          {manualOnlyLaunch ? (
            <p className="text-xs text-[var(--muted-soft)]">
              {t("billing.ui.mfs_handled_below")}
            </p>
          ) : !isLemonBilling ? (
            <p className="text-xs text-[var(--muted-soft)]">
              {t("billing.ui.card_only_actions")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Tabs value={activeSectionTab} onValueChange={(value) => setSectionTab(value as "plans" | "manual" | "ai" | "invoices")}>
        <TabsList className="h-auto flex w-full flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-2">
          <TabsTrigger value="plans">{t("billing.ui.plans_tab")}</TabsTrigger>
          {manualEnabled && <TabsTrigger value="manual">{t("billing.ui.payment_details_tab")}</TabsTrigger>}
          <TabsTrigger value="ai">{t("billing.ui.ai_credits_tab")}</TabsTrigger>
          <TabsTrigger value="invoices">{t("billing.ui.invoices")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeSectionTab === "plans" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-[var(--muted)]" />{t("billing.change_plan")}</CardTitle>
              <CardDescription>
                {manualOnlyLaunch
                  ? t("billing.ui.choose_plan_to_activate")
                  : t("billing.choose_plan")}
              </CardDescription>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant={interval === "monthly" ? "default" : "outline"}
                  onClick={() => setInterval("monthly")}
                >
                  {t("billing.ui.monthly")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={interval === "yearly" ? "default" : "outline"}
                  onClick={() => setInterval("yearly")}
                >
                  {t("billing.ui.yearly")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {PLAN_CATALOG.map((plan) => (
                <PlanTierCard
                  key={plan.id}
                  plan={plan}
                  interval={interval}
                  featured={plan.id === "professional"}
                  active={subscription?.plan === plan.id}
                  ctaLabel={
                    subscription?.plan === plan.id
                      ? t("billing.ui.current_plan")
                      : manualOnlyLaunch
                        ? subscription?.billing_source === "manual_mfs" && !subscription?.on_trial
                          ? t("billing.ui.request_update")
                          : t("billing.ui.choose_this_plan")
                        : t("billing.upgrade")
                  }
                  onCta={() => onSelectPlan(plan.id)}
                  disabled={
                    changePlan.isPending ||
                    (!manualOnlyLaunch && checkout.isPending) ||
                    subscription?.plan === plan.id
                  }
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[var(--muted)]" />{t("billing.addon_title")}</CardTitle>
              <CardDescription>{t("billing.addon_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {STORAGE_ADDON_FEATURES.map((feature, index) => (
                  <div key={feature} className="rounded-lg border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--muted)]">
                    {t(`plan.addon.feature.${index}`) === `plan.addon.feature.${index}` ? feature : t(`plan.addon.feature.${index}`)}
                  </div>
                ))}
              </div>
              {manualOnlyLaunch ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {t("billing.ui.unlimited_storage_note")}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await checkout.mutateAsync({
                        plan: "starter",
                        interval,
                        add_unlimited_storage: true,
                      });
                      if (response.checkout_url) {
                        window.location.assign(response.checkout_url);
                      }
                    } catch (error) {
                      toast({
                        title: t("billing.ui.checkout_failed"),
                        description: error instanceof Error ? error.message : t("billing.ui.checkout_error"),
                        variant: "error",
                      });
                    }
                  }}
                  disabled={checkout.isPending}
                >
                  {t("billing.addon_buy")}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {manualEnabled && activeSectionTab === "manual" && (
        <Card ref={manualSectionRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-teal-700" />{t("billing.ui.mfs_billing")}</CardTitle>
            <CardDescription>
              {t("billing.ui.mfs_intro")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-5">
              {subscription?.billing_source === "manual_mfs" && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 space-y-3">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{t("billing.ui.update_request_title")}</div>
                  <p className="text-xs text-[var(--muted)]">
                    {t("billing.ui.lifecycle_desc")}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={manualLifecycleType}
                      onChange={(event) => setManualLifecycleType(event.target.value as "cancel" | "plan_change")}
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                    >
                      <option value="cancel">{t("billing.ui.cancel_subscription")}</option>
                      <option value="plan_change">{t("billing.ui.change_plan")}</option>
                    </select>
                    <Input type="datetime-local" value={manualLifecycleEffectiveAt} onChange={(event) => setManualLifecycleEffectiveAt(event.target.value)} />
                    {manualLifecycleType === "plan_change" && (
                      <>
                        <select
                          value={manualLifecyclePlan}
                          onChange={(event) => setManualLifecyclePlan(event.target.value as PlanId)}
                          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                        >
                          {PLAN_CATALOG.map((plan) => (
                            <option key={plan.id} value={plan.id}>{planLabel(t, plan.id)}</option>
                          ))}
                        </select>
                        <select
                          value={manualLifecycleInterval}
                          onChange={(event) => setManualLifecycleInterval(event.target.value as BillingInterval)}
                          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                        >
                          <option value="monthly">{t("billing.ui.monthly")}</option>
                          <option value="yearly">{t("billing.ui.yearly")}</option>
                        </select>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={onSubmitManualLifecycle} disabled={submitManualSubscriptionChange.isPending}>
                      {submitManualSubscriptionChange.isPending ? t("billing.ui.sending") : t("billing.ui.send_update_request")}
                    </Button>
                    {manualChangeStatus && <Badge>{t("billing.ui.update_status")}: {billingStatusLabel(t, manualChangeStatus.status)}</Badge>}
                  </div>
                  {manualChangeStatus?.rejection_reason && (
                    <p className="text-xs text-rose-700">{t("billing.ui.update_needed")}: {manualChangeStatus.rejection_reason}</p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--wash)] p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="subtle">{t("billing.ui.step_choose_channel")}</Badge>
                  <Badge variant="subtle">{t("billing.ui.step_send_amount")}</Badge>
                  <Badge variant="subtle">{t("billing.ui.step_share_details")}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {manualMethods?.methods?.map((method) => (
                    <button
                      key={method.public_id}
                      type="button"
                      onClick={() => setSelectedManualMethodPublicId(method.public_id)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        activeManualMethodId === method.public_id
                          ? "border-teal-700 bg-teal-700 text-white shadow-lg"
                          : "border-[var(--border)] bg-[var(--paper)] hover:border-teal-300"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Banknote className="h-4 w-4" />
                          {method.channel.toUpperCase()}
                        </div>
                        <span className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          activeManualMethodId === method.public_id
                            ? "border-teal-300 bg-teal-800 text-teal-100"
                            : "border-[var(--border)] bg-[var(--wash)] text-[var(--muted)]"
                        )}>
                          {method.receiver_number}
                        </span>
                      </div>
                      {method.account_name && (
                        <div className={cn(
                          "mt-1 text-sm",
                          activeManualMethodId === method.public_id ? "text-teal-100" : "text-[var(--muted)]"
                        )}>
                          {method.account_name}
                        </div>
                      )}
                      <p className={cn(
                        "mt-2 text-xs leading-5",
                        activeManualMethodId === method.public_id ? "text-teal-100" : "text-[var(--muted)]"
                      )}>
                        {locale === "bn" ? method.instructions_bn || method.instructions_en : method.instructions_en || method.instructions_bn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              {selectedManualMethod && (
                <Alert variant="success">
                  <AlertTitle>
                    {t("billing.ui.selected_channel")}: {selectedManualMethod.channel === "bkash" ? "bKash" : "Rocket"} • {selectedManualMethod.receiver_number}
                  </AlertTitle>
                  <AlertDescription>
                    {locale === "bn"
                      ? selectedManualMethod.instructions_bn || selectedManualMethod.instructions_en
                      : selectedManualMethod.instructions_en || selectedManualMethod.instructions_bn}
                  </AlertDescription>
                </Alert>
              )}

              {manualRequestStatus && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{t("billing.ui.latest_submission")}</div>
                    <Badge>{t("billing.ui.status")}: {billingStatusLabel(t, manualRequestStatus.status)}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-2">
                    <div>{t("billing.ui.plan")}: {planLabel(t, manualRequestStatus.plan)} ({t(manualRequestStatus.interval === "yearly" ? "billing.ui.yearly" : "billing.ui.monthly")})</div>
                    <div>{t("billing.ui.amount")}: {manualRequestStatus.amount} {manualRequestStatus.currency}</div>
                    <div>{t("billing.ui.transaction_id")}: {manualRequestStatus.transaction_id}</div>
                    <div>{t("billing.ui.sent_at")}: {formatDate(manualRequestStatus.sent_at, "PPp", locale)}</div>
                    {manualRequestStatus.temporary_access_expires_at && (
                      <div>{t("billing.ui.temp_access_until")}: {formatDate(manualRequestStatus.temporary_access_expires_at, "PPp", locale)}</div>
                    )}
                    {manualRequestStatus.approved_ends_at && (
                      <div>{t("billing.ui.approved_access_until")}: {formatDate(manualRequestStatus.approved_ends_at, "PPp", locale)}</div>
                    )}
                  </div>
                  {temporaryAccessText && manualRequestStatus.status === "pending" && (
                    <p className="mt-3 text-xs text-[var(--muted-soft)]">Temporary access {temporaryAccessText}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{t("billing.ui.share_billing_details")}</div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {t("billing.ui.details_usage")}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.plan")}</label>
                    <select
                      value={manualPlan}
                      onChange={(event) => setManualPlan(event.target.value as PlanId)}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                    >
                      {PLAN_CATALOG.map((plan) => (
                        <option key={plan.id} value={plan.id}>{planLabel(t, plan.id)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.exact_amount")}</label>
                    <Input
                      value={expectedAmount ? `${expectedAmount} ${manualMethods?.currency ?? "BDT"}` : t("billing.ui.not_configured")}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.sender_number")}</label>
                    <Input value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.transaction_id")}</label>
                    <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="TXN..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.sent_at")}</label>
                    <Input type="datetime-local" value={sentAt} onChange={(event) => setSentAt(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ui.screenshot")}</label>
                    <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} />
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>{t("billing.ui.trial_included")}</AlertTitle>
                <AlertDescription>
                  {t("billing.ui.trial_first")}
                </AlertDescription>
              </Alert>

              {!manualCanSubmitNow && (
                <Alert variant="warning">
                  <AlertTitle>{t("billing.ui.details_not_needed")}</AlertTitle>
                  <AlertDescription>
                    {t("billing.ui.trial_still_active")}{trialEndsOn ? ` (${trialEndsOn})` : ""}.
                  </AlertDescription>
                </Alert>
              )}

              {manualRequestStatus?.status === "rejected" && manualRequestStatus.rejection_reason && (
                <Alert variant="destructive">
                  <AlertTitle>{t("billing.ui.update_needed")}</AlertTitle>
                  <AlertDescription>{manualRequestStatus.rejection_reason}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={onSubmitManual} disabled={submitManualRequest.isPending || !expectedAmount || !selectedManualMethod || !manualCanSubmitNow}>
                  {submitManualRequest.isPending ? t("billing.ui.sending") : t("billing.ui.share_payment_details")}
                </Button>
                {manualRequestStatus && (
                  <Badge>
                    {t("billing.ui.status")}: {billingStatusLabel(t, manualRequestStatus.status)}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!manualOnlyLaunch && (
        <Dialog open={paymentChoiceOpen} onOpenChange={setPaymentChoiceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("billing.ui.choose_payment_method")}</DialogTitle>
              <DialogDescription>
                Select how you want to continue with the {pendingPlanChoice ?? "selected"} plan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <Button
                onClick={async () => {
                  if (!pendingPlanChoice) {
                    return;
                  }
                  setPaymentChoiceOpen(false);
                  await startCardCheckout(pendingPlanChoice);
                }}
                disabled={checkout.isPending}
              >
                {t("billing.ui.continue_card")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!pendingPlanChoice) {
                    return;
                  }
                  chooseManualPayment(pendingPlanChoice);
                }}
              >
                {t("billing.ui.pay_with_mfs")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {activeSectionTab === "ai" && (() => {
        const monthlyAllotment = subscription?.plan_limits?.monthly_ai_credits ?? aiCredits?.monthly_free_credits ?? 0;
        const freeBalance = aiCredits?.free_balance ?? 0;
        const usedThisCycle = Math.max(monthlyAllotment - freeBalance, 0);
        const allotmentPct = monthlyAllotment > 0 ? Math.min((usedThisCycle / monthlyAllotment) * 100, 100) : 0;
        const formatPackPrimary = (pack: { price_usd_cents: number; price_bdt: number }) =>
          isBdt ? `৳${pack.price_bdt.toLocaleString()}` : `$${(pack.price_usd_cents / 100).toFixed(2)}`;
        const formatPackSecondary = (pack: { price_usd_cents: number; price_bdt: number }) =>
          isBdt ? `$${(pack.price_usd_cents / 100).toFixed(2)} USD` : `৳${pack.price_bdt.toLocaleString()} BDT`;
        const ledgerLabel = (event_type: string) => {
          const key = `billing.ai.ledger.${event_type}`;
          const translated = t(key);
          return translated === key ? event_type.replace(/_/g, " ") : translated;
        };
        const showManualPay = manualEnabled && isBdt;
        return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-[var(--muted)]" />{t("billing.ai.title")}</CardTitle>
            <CardDescription>
              {manualOnlyLaunch ? t("billing.ai.desc_manual") : t("billing.ai.desc_default")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ai.free")}</div>
                <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                  {freeBalance}
                  {monthlyAllotment > 0 && (
                    <span className="text-sm font-normal text-[var(--muted-soft)]"> / {monthlyAllotment}</span>
                  )}
                </div>
                {monthlyAllotment > 0 && (
                  <>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--foreground)]"
                        style={{ width: `${allotmentPct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--muted-soft)]">
                      {t("billing.ai.monthly_allotment")
                        .replace("{used}", String(usedThisCycle))
                        .replace("{total}", String(monthlyAllotment))}
                    </div>
                  </>
                )}
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ai.paid")}</div>
                <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">{aiCredits?.paid_balance ?? 0}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ai.total")}</div>
                <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">{aiCredits?.total_balance ?? 0}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">{t("billing.ai.next_grant")}</div>
                <div className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {aiCredits?.next_free_grant_at ? new Date(aiCredits.next_free_grant_at).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US") : "—"}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {aiCredits?.pack_catalog?.map((pack) => (
                <button
                  key={pack.public_id}
                  type="button"
                  onClick={() => setSelectedAiPackId(pack.public_id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    activeAiPackId === pack.public_id
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-white shadow-lg"
                      : "border-[var(--border)] bg-[var(--paper)] hover:border-[var(--border)]"
                  )}
                >
                  <div className="text-sm font-semibold">{pack.name}</div>
                  <div className={cn("mt-1 text-xs", activeAiPackId === pack.public_id ? "text-slate-200" : "text-[var(--muted)]")}>
                    {pack.credits} {t("billing.ai.credits_suffix")}
                  </div>
                  <div className="mt-3 text-lg font-bold">
                    {formatPackPrimary(pack)}
                  </div>
                  <div className={cn("text-xs", activeAiPackId === pack.public_id ? "text-slate-200" : "text-[var(--muted-soft)]")}>
                    {formatPackSecondary(pack)}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {!manualOnlyLaunch && (
                <Button onClick={startAiCheckout} disabled={!selectedAiPack || aiCheckout.isPending}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span className="inline-flex items-center gap-2">
                    <AiIcon />
                    {aiCheckout.isPending ? t("billing.ai.starting_checkout") : t("billing.ai.buy_with_lemon")}
                  </span>
                </Button>
              )}
              {showManualPay && (
                <Button variant="outline" onClick={() => aiManualSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                  <Smartphone className="mr-2 h-4 w-4" />
                  <span className="inline-flex items-center gap-2">
                    <AiIcon />
                    {t("billing.ai.use_mfs")}
                  </span>
                </Button>
              )}
            </div>

            {manualOnlyLaunch && !manualEnabled && isBdt && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {t("billing.ai.mfs_not_configured")}
              </div>
            )}

            {showManualPay && selectedAiPack && (
              <div ref={aiManualSectionRef} className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-4 space-y-3">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t("billing.ai.topup_title")}</div>
                <div className="text-xs text-[var(--muted)]">
                  {t("billing.ai.topup_selected")
                    .replace("{name}", selectedAiPack.name)
                    .replace("{credits}", String(selectedAiPack.credits))
                    .replace("{amount}", `৳${selectedAiPack.price_bdt.toLocaleString()}`)}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={aiSenderNumber} onChange={(event) => setAiSenderNumber(event.target.value)} placeholder={t("billing.ai.sender_placeholder")} />
                  <Input value={aiTransactionId} onChange={(event) => setAiTransactionId(event.target.value)} placeholder={t("billing.ai.transaction_placeholder")} />
                  <Input type="datetime-local" value={aiSentAt} onChange={(event) => setAiSentAt(event.target.value)} />
                  <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setAiScreenshot(event.target.files?.[0] ?? null)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={onSubmitAiManual} disabled={submitAiMfsRequest.isPending}>
                    <FileClock className="mr-2 h-4 w-4" />
                    <span className="inline-flex items-center gap-2">
                      <AiIcon />
                      {submitAiMfsRequest.isPending ? t("billing.ai.sending") : t("billing.ai.share_topup")}
                    </span>
                  </Button>
                  {aiMfsStatus && <Badge>{t("billing.ai.status_label")}: {billingStatusLabel(t, aiMfsStatus.status)}</Badge>}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"><History className="h-4 w-4 text-[var(--muted-soft)]" />{t("billing.ai.recent_events")}</div>
              <div className="mt-2 space-y-2">
                {aiLedger.slice(0, 5).map((event) => (
                  <div key={event.public_id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-2 text-xs">
                    <div>
                      <div className="font-medium">{ledgerLabel(event.event_type)}</div>
                      <div className="text-[var(--muted-soft)]">{event.feature ?? t("billing.ai.wallet_feature")}</div>
                    </div>
                    <div className={cn("font-semibold", event.credits_delta < 0 ? "text-rose-600" : "text-emerald-600")}>
                      {event.credits_delta > 0 ? "+" : ""}
                      {event.credits_delta}
                    </div>
                  </div>
                ))}
                {aiLedger.length === 0 && <div className="text-xs text-[var(--muted-soft)]">{t("billing.ai.no_events")}</div>}
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })()}

      {activeSectionTab === "invoices" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileClock className="h-5 w-5 text-[var(--muted)]" />{t("billing.invoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-sm text-[var(--muted-soft)]">{t("billing.no_invoices")}</div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm">
                  <div>
                    <div className="font-medium">#{invoice.order_number}</div>
                    <div className="text-xs text-[var(--muted-soft)]">{formatDate(invoice.ordered_at, "PP", locale)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{invoice.total / 100} {invoice.currency.toUpperCase()}</span>
                    {invoice.receipt_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={invoice.receipt_url} target="_blank" rel="noreferrer">{t("billing.ui.receipt")}</a>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </section>
  );
}
