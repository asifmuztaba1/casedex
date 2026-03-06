"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useResumeSubscription,
  useSubmitManualRequest,
  useSubscription,
} from "@/features/billing/use-billing";
import type { BillingInterval } from "@/features/billing/types";
import { useLocale } from "@/components/locale-provider";
import { PLAN_CATALOG, STORAGE_ADDON_FEATURES, type PlanId } from "@/features/billing/plan-catalog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function BillingSettingsPage() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
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
  const { data: subscription } = useSubscription();
  const { data: invoices = [] } = useInvoices();
  const { data: manualMethods } = useManualMethods();
  const { data: manualRequestStatus } = useManualRequestStatus();
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
  const { toast } = useToast();
  const [selectedAiPackId, setSelectedAiPackId] = useState<string>("");
  const [aiSenderNumber, setAiSenderNumber] = useState("");
  const [aiTransactionId, setAiTransactionId] = useState("");
  const [aiSentAt, setAiSentAt] = useState("");
  const [aiScreenshot, setAiScreenshot] = useState<File | null>(null);

  const trialText = useMemo(() => {
    if (!subscription?.trial_ends_at) {
      return null;
    }

    return formatDistanceToNowStrict(new Date(subscription.trial_ends_at), {
      addSuffix: true,
    });
  }, [subscription?.trial_ends_at]);

  const temporaryAccessText = useMemo(() => {
    if (!manualRequestStatus?.temporary_access_expires_at) {
      return null;
    }

    return formatDistanceToNowStrict(new Date(manualRequestStatus.temporary_access_expires_at), {
      addSuffix: true,
    });
  }, [manualRequestStatus?.temporary_access_expires_at]);

  const fromOnboarding = searchParams.get("onboarding") === "1";
  const preferManual = searchParams.get("source") === "manual";
  const manualEnabled = Boolean(manualMethods?.enabled);
  const expectedAmount = manualMethods?.prices?.[manualPlan]?.[interval] ?? null;
  const selectedManualMethod = useMemo(
    () => manualMethods?.methods?.find((method) => method.public_id === selectedManualMethodPublicId) ?? null,
    [manualMethods?.methods, selectedManualMethodPublicId]
  );

  useEffect(() => {
    if (!manualMethods?.methods?.length) {
      return;
    }

    if (
      selectedManualMethodPublicId === "" ||
      !manualMethods.methods.some((method) => method.public_id === selectedManualMethodPublicId)
    ) {
      setSelectedManualMethodPublicId(manualMethods.methods[0].public_id);
    }
  }, [manualMethods?.methods, selectedManualMethodPublicId]);

  useEffect(() => {
    if (!aiCredits?.pack_catalog?.length) {
      return;
    }

    if (selectedAiPackId === "" || !aiCredits.pack_catalog.some((pack) => pack.public_id === selectedAiPackId)) {
      setSelectedAiPackId(aiCredits.pack_catalog[0].public_id);
    }
  }, [aiCredits?.pack_catalog, selectedAiPackId]);

  const startCardCheckout = async (plan: PlanId) => {
    try {
      const response = await checkout.mutateAsync({ plan, interval });
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
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
    manualSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast({
      title: "Manual payment selected",
      description: "Complete bKash/Rocket details below to submit your payment proof.",
    });
  };

  const onSelectPlan = async (plan: PlanId) => {
    setManualPlan(plan);

    try {
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
      if (!selectedManualMethod || !expectedAmount || !senderNumber || !transactionId || !sentAt || !screenshot) {
        toast({
          title: "Manual payment details required",
          description: "Select payment option, fill all fields, and attach screenshot.",
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
        title: "Manual payment submitted",
        description: "Temporary workspace access is enabled while admin reviews your request.",
      });

      setSenderNumber("");
      setTransactionId("");
      setSentAt("");
      setScreenshot(null);
    } catch (error) {
      toast({
        title: "Manual payment submit failed",
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
        window.location.href = response.checkout_url;
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
        title: "AI manual payment details required",
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
        title: "AI manual payment submitted",
        description: "Your AI credit request is now pending admin approval.",
      });
    } catch (error) {
      toast({
        title: "AI manual payment failed",
        description: error instanceof Error ? error.message : "Unable to submit AI payment request.",
        variant: "error",
      });
    }
  };

  const selectedAiPack = useMemo(
    () => aiCredits?.pack_catalog?.find((pack) => pack.public_id === selectedAiPackId) ?? null,
    [aiCredits?.pack_catalog, selectedAiPackId]
  );

  return (
    <section className="space-y-6">
      {fromOnboarding && (
        <Card className="border-slate-300 bg-slate-50">
          <CardHeader>
            <CardTitle>{t("billing.onboarding_title")}</CardTitle>
            <CardDescription>
              {t("billing.onboarding_desc")}
            </CardDescription>
            {preferManual && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                Manual payment selected during registration. Complete bKash/Rocket submission below.
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.title")}</CardTitle>
          <CardDescription>{t("billing.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{subscription?.plan ?? "trial"}</Badge>
            <Badge>{subscription?.status ?? "on_trial"}</Badge>
            {subscription?.billing_source === "manual_mfs" && (
              <Badge>Manual MFS</Badge>
            )}
            {trialText && <span className="text-xs text-slate-500">{t("billing.trial_ends")}: {trialText}</span>}
          </div>
          {subscription?.plan_limits && (
            <StorageMeter
              usedBytes={subscription.plan_limits.storage_used_bytes}
              limitBytes={subscription.plan_limits.storage_limit_bytes}
              hasUnlimitedStorage={subscription.plan_limits.has_unlimited_storage}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await portal.mutateAsync();
                  if (response.portal_url) {
                    window.location.href = response.portal_url;
                  }
                } catch (error) {
                  toast({
                    title: "Portal unavailable",
                    description: error instanceof Error ? error.message : "Unable to open billing portal.",
                    variant: "error",
                  });
                }
              }}
            >
              {t("billing.manage_portal")}
            </Button>
            <Button
              variant="outline"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              {t("billing.cancel")}
            </Button>
            <Button onClick={() => resume.mutate()} disabled={resume.isPending}>
              {t("billing.resume")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.change_plan")}</CardTitle>
          <CardDescription>{t("billing.choose_plan")}</CardDescription>
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
              ctaLabel={subscription?.plan === plan.id ? "Current plan" : t("billing.upgrade")}
              onCta={() => onSelectPlan(plan.id)}
              disabled={
                checkout.isPending ||
                changePlan.isPending ||
                subscription?.plan === plan.id
              }
            />
          ))}
        </CardContent>
      </Card>

      {manualEnabled && (
        <Card ref={manualSectionRef}>
          <CardHeader>
            <CardTitle>Manual bKash/Rocket payment (Bangladesh)</CardTitle>
            <CardDescription>
              Step 1: Select one payment option. Step 2: Send exact amount. Step 3: Submit transaction details and screenshot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {manualMethods?.methods?.map((method) => (
                <button
                  key={method.public_id}
                  type="button"
                  onClick={() => setSelectedManualMethodPublicId(method.public_id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    selectedManualMethodPublicId === method.public_id
                      ? "border-teal-700 bg-teal-700 text-white shadow-lg"
                      : "border-slate-200 bg-slate-50 hover:border-teal-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{method.channel.toUpperCase()}</div>
                    <span className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      selectedManualMethodPublicId === method.public_id
                        ? "border-teal-300 bg-teal-800 text-teal-100"
                        : "border-slate-200 bg-white text-slate-700"
                    )}>
                      {method.receiver_number}
                    </span>
                  </div>
                  {method.account_name && (
                    <div className={cn(
                      "mt-1 text-sm",
                      selectedManualMethodPublicId === method.public_id ? "text-teal-100" : "text-slate-700"
                    )}>
                      {method.account_name}
                    </div>
                  )}
                  <p className={cn(
                    "mt-2 text-xs leading-5",
                    selectedManualMethodPublicId === method.public_id ? "text-teal-100" : "text-slate-600"
                  )}>
                    {locale === "bn" ? method.instructions_bn || method.instructions_en : method.instructions_en || method.instructions_bn}
                  </p>
                </button>
              ))}
            </div>

            {selectedManualMethod && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                <div className="font-semibold">
                  Selected: {selectedManualMethod.channel.toUpperCase()} • {selectedManualMethod.receiver_number}
                </div>
                <p className="mt-1 text-xs leading-5">
                  {locale === "bn"
                    ? selectedManualMethod.instructions_bn || selectedManualMethod.instructions_en
                    : selectedManualMethod.instructions_en || selectedManualMethod.instructions_bn}
                </p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Package</label>
                <select
                  value={manualPlan}
                  onChange={(event) => setManualPlan(event.target.value as PlanId)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                >
                  {PLAN_CATALOG.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exact amount</label>
                <Input
                  value={expectedAmount ? `${expectedAmount} ${manualMethods?.currency ?? "BDT"}` : "Not configured"}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sender number</label>
                <Input value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction ID</label>
                <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="TXN..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment sent at</label>
                <Input type="datetime-local" value={sentAt} onChange={(event) => setSentAt(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Screenshot</label>
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div>{t("billing.trial_notice_line1")}</div>
              <div>{t("billing.trial_notice_line2")}</div>
              <div>{t("billing.trial_notice_line3")}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onSubmitManual} disabled={submitManualRequest.isPending || !expectedAmount || !selectedManualMethod}>
                {submitManualRequest.isPending ? "Submitting..." : "Submit manual payment"}
              </Button>
              {manualRequestStatus && (
                <Badge>
                  Status: {manualRequestStatus.status}
                </Badge>
              )}
              {temporaryAccessText && manualRequestStatus?.status === "pending" && (
                <span className="text-xs text-slate-500">
                  Temporary access {temporaryAccessText}
                </span>
              )}
            </div>

            {manualRequestStatus?.status === "rejected" && manualRequestStatus.rejection_reason && (
              <p className="text-sm text-rose-600">Rejection reason: {manualRequestStatus.rejection_reason}</p>
            )}

            {manualRequestStatus && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Your latest submission</div>
                <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-2">
                  <div>Status: {manualRequestStatus.status}</div>
                  <div>Plan: {manualRequestStatus.plan} ({manualRequestStatus.interval})</div>
                  <div>Amount: {manualRequestStatus.amount} {manualRequestStatus.currency}</div>
                  <div>Transaction ID: {manualRequestStatus.transaction_id}</div>
                  <div>Sender: {manualRequestStatus.sender_number}</div>
                  <div>Sent at: {new Date(manualRequestStatus.sent_at).toLocaleString()}</div>
                  {manualRequestStatus.temporary_access_expires_at && (
                    <div>Temporary access until: {new Date(manualRequestStatus.temporary_access_expires_at).toLocaleString()}</div>
                  )}
                  {manualRequestStatus.approved_ends_at && (
                    <div>Approved access until: {new Date(manualRequestStatus.approved_ends_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.addon_title")}</CardTitle>
          <CardDescription>{t("billing.addon_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {STORAGE_ADDON_FEATURES.map((feature) => (
              <div key={feature} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {feature}
              </div>
            ))}
          </div>
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
                  window.location.href = response.checkout_url;
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Credits</CardTitle>
          <CardDescription>Monthly free credits + paid top-ups for AI actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Free</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{aiCredits?.free_balance ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Paid</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{aiCredits?.paid_balance ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{aiCredits?.total_balance ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Next free grant</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
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
                  selectedAiPackId === pack.public_id
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="text-sm font-semibold">{pack.name}</div>
                <div className={cn("mt-1 text-xs", selectedAiPackId === pack.public_id ? "text-slate-200" : "text-slate-600")}>
                  {pack.credits} credits
                </div>
                <div className="mt-3 text-lg font-bold">
                  ${(pack.price_usd_cents / 100).toFixed(2)}
                </div>
                <div className={cn("text-xs", selectedAiPackId === pack.public_id ? "text-slate-200" : "text-slate-500")}>
                  {pack.price_bdt} BDT
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={startAiCheckout} disabled={!selectedAiPack || aiCheckout.isPending}>
              {aiCheckout.isPending ? "Starting checkout..." : "Buy with Lemon"}
            </Button>
            {manualEnabled && (
              <Button variant="outline" onClick={() => manualSectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
                Use bKash/Rocket for subscription
              </Button>
            )}
          </div>

          {manualEnabled && selectedAiPack && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-900">Bangladesh manual top-up for AI credits</div>
              <div className="text-xs text-slate-600">
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
                  {submitAiMfsRequest.isPending ? "Submitting..." : "Submit AI manual payment"}
                </Button>
                {aiMfsStatus && <Badge>Status: {aiMfsStatus.status}</Badge>}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Recent AI credit events</div>
            <div className="mt-2 space-y-2">
              {aiLedger.slice(0, 5).map((event) => (
                <div key={event.public_id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-xs">
                  <div>
                    <div className="font-medium">{event.event_type}</div>
                    <div className="text-slate-500">{event.feature ?? "wallet"}</div>
                  </div>
                  <div className={cn("font-semibold", event.credits_delta < 0 ? "text-rose-600" : "text-emerald-600")}>
                    {event.credits_delta > 0 ? "+" : ""}
                    {event.credits_delta}
                  </div>
                </div>
              ))}
              {aiLedger.length === 0 && <div className="text-xs text-slate-500">No AI credit events yet.</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.invoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-sm text-slate-500">{t("billing.no_invoices")}</div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                  <div>
                    <div className="font-medium">#{invoice.order_number}</div>
                    <div className="text-xs text-slate-500">{new Date(invoice.ordered_at).toLocaleDateString()}</div>
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
    </section>
  );
}
