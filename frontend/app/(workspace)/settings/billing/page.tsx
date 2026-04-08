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

export default function BillingSettingsPage() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const manualOnlyLaunch = isManualMfsOnlyLaunch();
  const fromOnboarding = searchParams.get("onboarding") === "1";
  const preferManual = searchParams.get("source") === "manual";
  const initialInterval = searchParams.get("interval") === "yearly" ? "yearly" : "monthly";
  const initialPlan = (searchParams.get("plan") as PlanId) || "professional";
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [manualPlan, setManualPlan] = useState<PlanId>(
    PLAN_CATALOG.some((item) => item.id === initialPlan) ? initialPlan : "professional"
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
        title: "Billing update failed",
        description: error instanceof Error ? error.message : "Unable to update billing.",
        variant: "error",
      });
    }
  };

  const chooseManualPayment = (plan: PlanId) => {
    setManualPlan(plan);
    setPaymentChoiceOpen(false);
    scrollToManualSection();
    toast({
      title: manualOnlyLaunch ? "bKash / Rocket billing selected" : "bKash / Rocket selected",
      description: manualOnlyLaunch
        ? "This beta uses bKash / Rocket billing. Review the steps below to continue."
        : "Complete the bKash / Rocket details below to continue.",
    });
  };

  const onSelectPlan = async (plan: PlanId) => {
    setManualPlan(plan);

    try {
      if (manualOnlyLaunch) {
        if (!manualEnabled) {
          toast({
            title: "MFS billing unavailable",
            description: "bKash / Rocket methods are not configured yet.",
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
            title: "Plan change request prepared",
            description: "Review the subscription update form below and send it when you are ready.",
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
        title: "Billing update failed",
        description: error instanceof Error ? error.message : "Unable to update billing.",
        variant: "error",
      });
    }
  };

  const onSubmitManual = async () => {
      if (!manualCanSubmitNow) {
        toast({
          title: "Payment not needed yet",
          description: "You can submit MFS payment after your 30-day trial ends.",
          variant: "error",
        });
        return;
      }

      if (!selectedManualMethod || !expectedAmount || !senderNumber || !transactionId || !sentAt || !screenshot) {
        toast({
          title: "Payment details required",
          description: "Choose a channel, fill all fields, and attach the screenshot.",
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
        transaction_id: transactionId,
        sent_at: sentAtIso,
        screenshot,
      });

      toast({
        title: "Billing details received",
        description: "Your workspace stays available while the team reviews this submission.",
      });

      setSenderNumber("");
      setTransactionId("");
      setSentAt("");
      setScreenshot(null);
    } catch (error) {
      toast({
        title: "Billing submission failed",
        description: error instanceof Error ? error.message : "Unable to submit request.",
        variant: "error",
      });
    }
  };

  const startAiCheckout = async () => {
    if (!selectedAiPack) {
      toast({
        title: "Select AI pack",
        description: "Choose a pack before checkout.",
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
        title: "AI top-up failed",
        description: error instanceof Error ? error.message : "Unable to start checkout.",
        variant: "error",
      });
    }
  };

  const onSubmitAiManual = async () => {
    if (!selectedAiPack || !aiSenderNumber || !aiTransactionId || !aiSentAt || !aiScreenshot) {
      toast({
        title: "AI top-up details required",
        description: "Fill all fields and attach screenshot.",
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
        title: "AI top-up details received",
        description: "Your AI credit request is now being reviewed.",
      });
    } catch (error) {
      toast({
        title: "AI top-up submission failed",
        description: error instanceof Error ? error.message : "Unable to submit AI payment request.",
        variant: "error",
      });
    }
  };

  const onSubmitManualLifecycle = async () => {
    if (!manualLifecycleEffectiveAt) {
      toast({
        title: "Effective date required",
        description: "Choose when the change should take effect.",
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
        title: "Request submitted",
        description: "The team will review your subscription update request.",
      });
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unable to submit request.",
        variant: "error",
      });
    }
  };

  const isLemonBilling = subscription?.billing_source === "lemon";
  const canManageLemonSubscription = isLemonBilling && Boolean(subscription?.status && subscription.status !== "expired");
  const trialEndsOn = manualMethods?.trial_ends_at ? new Date(manualMethods.trial_ends_at).toLocaleDateString() : null;
  const billingRouteLabel = manualOnlyLaunch
    ? "bKash / Rocket beta flow"
    : isLemonBilling
      ? "Card billing"
      : manualEnabled
        ? "bKash / Rocket available"
        : "Trial access";
  const nextStepLabel = manualRequestStatus?.status === "pending"
    ? "Review in progress"
    : !manualCanSubmitNow
      ? `Share details after trial${trialEndsOn ? ` on ${trialEndsOn}` : ""}`
      : manualOnlyLaunch
        ? "Choose a plan and share billing details"
        : canManageLemonSubscription
          ? "Manage your subscription"
          : "Pick the plan that fits your team";

  return (
    <section className="space-y-6">
      {fromOnboarding && (
        <Card className="border-[var(--border)] bg-[var(--wash)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-emerald-700" />{t("billing.onboarding_title")}</CardTitle>
            <CardDescription>
              {t("billing.onboarding_desc")}
            </CardDescription>
            {preferManual && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                bKash / Rocket was selected during registration. Complete your billing details below when you are ready.
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
              ? "This private beta uses a guided bKash / Rocket flow for subscriptions and AI top-ups."
              : t("billing.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{subscription?.plan ?? "trial"}</Badge>
            <Badge>{subscription?.status ?? "on_trial"}</Badge>
            {subscription?.billing_source === "manual_mfs" && (
              <Badge>bKash / Rocket</Badge>
            )}
            {trialText && <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-soft)]"><CalendarClock className="h-3.5 w-3.5" />{t("billing.trial_ends")}: {trialText}</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Current plan</div>
              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{subscription?.plan ?? "trial"}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Billing route</div>
              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{billingRouteLabel}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Next step</div>
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
                        title: "Portal unavailable",
                        description: error instanceof Error ? error.message : "Unable to open billing portal.",
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
                {manualOnlyLaunch ? "Open payment details" : "Open bKash / Rocket billing"}
              </Button>
            )}
          </div>
          {manualOnlyLaunch ? (
            <p className="text-xs text-[var(--muted-soft)]">
              Subscription updates and AI top-ups are handled through the bKash / Rocket flow below during this beta.
            </p>
          ) : !isLemonBilling ? (
            <p className="text-xs text-[var(--muted-soft)]">
              Subscription management actions are available for Lemon-managed subscriptions.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Tabs value={activeSectionTab} onValueChange={(value) => setSectionTab(value as "plans" | "manual" | "ai" | "invoices")}>
        <TabsList className="h-auto flex w-full flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-2">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          {manualEnabled && <TabsTrigger value="manual">Payment Details</TabsTrigger>}
          <TabsTrigger value="ai">AI Credits</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeSectionTab === "plans" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-[var(--muted)]" />{t("billing.change_plan")}</CardTitle>
              <CardDescription>
                {manualOnlyLaunch
                  ? "Choose the plan you want to activate with bKash / Rocket billing."
                  : t("billing.choose_plan")}
              </CardDescription>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant={interval === "monthly" ? "default" : "outline"}
                  onClick={() => setInterval("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={interval === "yearly" ? "default" : "outline"}
                  onClick={() => setInterval("yearly")}
                >
                  Yearly
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
                      ? "Current plan"
                      : manualOnlyLaunch
                        ? subscription?.billing_source === "manual_mfs" && !subscription?.on_trial
                          ? "Request update"
                          : "Choose this plan"
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
                {STORAGE_ADDON_FEATURES.map((feature) => (
                  <div key={feature} className="rounded-lg border border-[var(--border)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--muted)]">
                    {feature}
                  </div>
                ))}
              </div>
              {manualOnlyLaunch ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Unlimited storage is not self-serve in this beta yet. Reach out to the team if you need it enabled for your workspace.
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
                        title: "Checkout failed",
                        description: error instanceof Error ? error.message : "Unable to start checkout.",
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
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-teal-700" />bKash / Rocket billing</CardTitle>
            <CardDescription>
              Choose a channel, send the exact amount, then share the transfer details here so your workspace can be updated quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-5">
              {subscription?.billing_source === "manual_mfs" && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 space-y-3">
                  <div className="text-sm font-semibold text-[var(--foreground)]">Subscription update request</div>
                  <p className="text-xs text-[var(--muted)]">
                    Schedule a cancellation or plan change. The selected update is applied after review on the date you choose.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={manualLifecycleType}
                      onChange={(event) => setManualLifecycleType(event.target.value as "cancel" | "plan_change")}
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                    >
                      <option value="cancel">Cancel subscription</option>
                      <option value="plan_change">Change plan</option>
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
                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                          ))}
                        </select>
                        <select
                          value={manualLifecycleInterval}
                          onChange={(event) => setManualLifecycleInterval(event.target.value as BillingInterval)}
                          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={onSubmitManualLifecycle} disabled={submitManualSubscriptionChange.isPending}>
                      {submitManualSubscriptionChange.isPending ? "Sending..." : "Send update request"}
                    </Button>
                    {manualChangeStatus && <Badge>Update status: {manualChangeStatus.status}</Badge>}
                  </div>
                  {manualChangeStatus?.rejection_reason && (
                    <p className="text-xs text-rose-700">Update needed: {manualChangeStatus.rejection_reason}</p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--wash)] p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="subtle">1. Choose a channel</Badge>
                  <Badge variant="subtle">2. Send the exact amount</Badge>
                  <Badge variant="subtle">3. Share your details</Badge>
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
                    Selected channel: {selectedManualMethod.channel.toUpperCase()} • {selectedManualMethod.receiver_number}
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
                    <div className="text-sm font-semibold text-[var(--foreground)]">Latest billing submission</div>
                    <Badge>Status: {manualRequestStatus.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-2">
                    <div>Plan: {manualRequestStatus.plan} ({manualRequestStatus.interval})</div>
                    <div>Amount: {manualRequestStatus.amount} {manualRequestStatus.currency}</div>
                    <div>Transaction ID: {manualRequestStatus.transaction_id}</div>
                    <div>Sent at: {new Date(manualRequestStatus.sent_at).toLocaleString()}</div>
                    {manualRequestStatus.temporary_access_expires_at && (
                      <div>Temporary access until: {new Date(manualRequestStatus.temporary_access_expires_at).toLocaleString()}</div>
                    )}
                    {manualRequestStatus.approved_ends_at && (
                      <div>Approved access until: {new Date(manualRequestStatus.approved_ends_at).toLocaleString()}</div>
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
                  <div className="text-sm font-semibold text-[var(--foreground)]">Share billing details</div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    We use these details to match your transfer and activate the selected plan for your workspace.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">Plan</label>
                    <select
                      value={manualPlan}
                      onChange={(event) => setManualPlan(event.target.value as PlanId)}
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)]"
                    >
                      {PLAN_CATALOG.map((plan) => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">Exact amount</label>
                    <Input
                      value={expectedAmount ? `${expectedAmount} ${manualMethods?.currency ?? "BDT"}` : "Not configured"}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">Sender number</label>
                    <Input value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">Transaction ID</label>
                    <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="TXN..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">Sent at</label>
                    <Input type="datetime-local" value={sentAt} onChange={(event) => setSentAt(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">Screenshot</label>
                    <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} />
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>30-day trial included</AlertTitle>
                <AlertDescription>
                  Start with the included trial first. You only need to share billing details when you are ready to continue beyond the trial.
                </AlertDescription>
              </Alert>

              {!manualCanSubmitNow && (
                <Alert variant="warning">
                  <AlertTitle>Billing details are not needed yet</AlertTitle>
                  <AlertDescription>
                    Your trial is still active. Share your billing details after the trial ends{trialEndsOn ? ` (${trialEndsOn})` : ""}.
                  </AlertDescription>
                </Alert>
              )}

              {manualRequestStatus?.status === "rejected" && manualRequestStatus.rejection_reason && (
                <Alert variant="destructive">
                  <AlertTitle>Update needed</AlertTitle>
                  <AlertDescription>{manualRequestStatus.rejection_reason}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={onSubmitManual} disabled={submitManualRequest.isPending || !expectedAmount || !selectedManualMethod || !manualCanSubmitNow}>
                  {submitManualRequest.isPending ? "Sending..." : "Share payment details"}
                </Button>
                {manualRequestStatus && (
                  <Badge>
                    Status: {manualRequestStatus.status}
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
              <DialogTitle>Choose payment method</DialogTitle>
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
                Continue with card checkout
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
                Pay with bKash / Rocket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {activeSectionTab === "ai" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-[var(--muted)]" />AI Credits</CardTitle>
          <CardDescription>
            {manualOnlyLaunch
              ? "Monthly free credits plus bKash / Rocket top-ups for extra AI usage during beta."
              : "Monthly free credits + paid top-ups for AI actions."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Free</div>
              <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">{aiCredits?.free_balance ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Paid</div>
              <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">{aiCredits?.paid_balance ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Total</div>
              <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">{aiCredits?.total_balance ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--wash)] p-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted-soft)]">Next free grant</div>
              <div className="mt-1 text-sm font-medium text-[var(--foreground)]">
                {aiCredits?.next_free_grant_at ? new Date(aiCredits.next_free_grant_at).toLocaleDateString() : "N/A"}
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
                  {pack.credits} credits
                </div>
                <div className="mt-3 text-lg font-bold">
                  ${(pack.price_usd_cents / 100).toFixed(2)}
                </div>
                <div className={cn("text-xs", activeAiPackId === pack.public_id ? "text-slate-200" : "text-[var(--muted-soft)]")}>
                  {pack.price_bdt} BDT
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
                  {aiCheckout.isPending ? "Starting checkout..." : "Buy with Lemon"}
                </span>
              </Button>
            )}
            {manualEnabled && (
              <Button variant="outline" onClick={() => aiManualSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                <Smartphone className="mr-2 h-4 w-4" />
                <span className="inline-flex items-center gap-2">
                  <AiIcon />
                  {manualOnlyLaunch ? "Use bKash/Rocket for AI top-up" : "Use bKash/Rocket for AI top-up"}
                </span>
              </Button>
            )}
          </div>

          {manualOnlyLaunch && !manualEnabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              AI top-ups run through bKash / Rocket in this beta, but the payment channels are not configured yet.
            </div>
          )}

          {manualEnabled && selectedAiPack && (
            <div ref={aiManualSectionRef} className="rounded-xl border border-[var(--border)] bg-[var(--wash)] p-4 space-y-3">
              <div className="text-sm font-semibold text-[var(--foreground)]">AI credit top-up details</div>
              <div className="text-xs text-[var(--muted)]">
                Selected pack: {selectedAiPack.name} ({selectedAiPack.credits} credits), amount: {selectedAiPack.price_bdt} BDT.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={aiSenderNumber} onChange={(event) => setAiSenderNumber(event.target.value)} placeholder="Sender number" />
                <Input value={aiTransactionId} onChange={(event) => setAiTransactionId(event.target.value)} placeholder="Transaction ID" />
                <Input type="datetime-local" value={aiSentAt} onChange={(event) => setAiSentAt(event.target.value)} />
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setAiScreenshot(event.target.files?.[0] ?? null)} />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={onSubmitAiManual} disabled={submitAiMfsRequest.isPending}>
                  <FileClock className="mr-2 h-4 w-4" />
                  <span className="inline-flex items-center gap-2">
                    <AiIcon />
                    {submitAiMfsRequest.isPending ? "Sending..." : "Share AI top-up details"}
                  </span>
                </Button>
                {aiMfsStatus && <Badge>Status: {aiMfsStatus.status}</Badge>}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"><History className="h-4 w-4 text-[var(--muted-soft)]" />Recent AI credit events</div>
            <div className="mt-2 space-y-2">
              {aiLedger.slice(0, 5).map((event) => (
                <div key={event.public_id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-2 text-xs">
                  <div>
                    <div className="font-medium">{event.event_type}</div>
                    <div className="text-[var(--muted-soft)]">{event.feature ?? "wallet"}</div>
                  </div>
                  <div className={cn("font-semibold", event.credits_delta < 0 ? "text-rose-600" : "text-emerald-600")}>
                    {event.credits_delta > 0 ? "+" : ""}
                    {event.credits_delta}
                  </div>
                </div>
              ))}
              {aiLedger.length === 0 && <div className="text-xs text-[var(--muted-soft)]">No AI credit events yet.</div>}
            </div>
          </div>
        </CardContent>
      </Card>
      )}

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
                    <div className="text-xs text-[var(--muted-soft)]">{new Date(invoice.ordered_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{invoice.total / 100} {invoice.currency.toUpperCase()}</span>
                    {invoice.receipt_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={invoice.receipt_url} target="_blank" rel="noreferrer">Receipt</a>
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
