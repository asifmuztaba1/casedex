"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OnboardingShell from "@/components/onboarding-shell";
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft, type OnboardingPaymentSource } from "@/features/auth/onboarding-draft";
import { useAuth, useCreateTenant } from "@/features/auth/use-auth";
import { PLAN_CATALOG, type PlanId } from "@/features/billing/plan-catalog";
import type { BillingInterval } from "@/features/billing/types";
import { useCheckout, useManualMethods, useSubmitManualRequest } from "@/features/billing/use-billing";
import { cn } from "@/lib/utils";
import { CreditCard, Smartphone } from "lucide-react";

function isValidPlan(value: string | null): value is PlanId {
  if (value === null) {
    return false;
  }

  return PLAN_CATALOG.some((item) => item.id === value);
}

export default function OnboardingPaymentPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useAuth();
  const createTenant = useCreateTenant();
  const checkout = useCheckout();
  const submitManualRequest = useSubmitManualRequest();
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [paymentSource, setPaymentSource] = useState<OnboardingPaymentSource | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [allowTenantDuringManual, setAllowTenantDuringManual] = useState(false);
  const [selectedManualMethodPublicId, setSelectedManualMethodPublicId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [sentAt, setSentAt] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const isBangladesh = user?.country_code === "BD";
  const { data: manualMethods } = useManualMethods(Boolean(manualDialogOpen && user?.tenant_id));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tenant_id && !allowTenantDuringManual) {
      const hasWorkspaceAccess = user.tenant?.has_workspace_access ?? user.tenant?.has_active_subscription ?? false;
      router.replace(hasWorkspaceAccess ? "/dashboard" : "/settings/billing?onboarding=1");
      return;
    }

    if (!user.email_verified_at) {
      router.replace("/onboarding/account");
      return;
    }

    if (!isBootstrapped) {
      const draft = loadOnboardingDraft(user.email);
      const planFromQuery = searchParams.get("plan");
      const intervalFromQuery = searchParams.get("interval");

      if (isValidPlan(planFromQuery)) {
        setPlan(planFromQuery);
      } else if (draft.plan) {
        setPlan(draft.plan);
      }

      if (intervalFromQuery === "yearly" || draft.interval === "yearly") {
        setInterval("yearly");
      }

      if (isBangladesh) {
        setPaymentSource(draft.payment_source ?? null);
      } else {
        setPaymentSource("lemon");
      }

      setIsBootstrapped(true);
    }
  }, [allowTenantDuringManual, isBangladesh, isBootstrapped, isLoading, router, searchParams, user]);

  useEffect(() => {
    if (!user || !isBootstrapped) {
      return;
    }

    if (!plan) {
      router.replace("/onboarding/plan");
      return;
    }

    saveOnboardingDraft(user.email, {
      ...loadOnboardingDraft(user.email),
      plan,
      interval,
      payment_source: paymentSource ?? undefined,
    });
  }, [interval, isBootstrapped, paymentSource, plan, router, user]);

  const selectedPlan = useMemo(() => PLAN_CATALOG.find((item) => item.id === plan) ?? null, [plan]);
  const selectedManualMethod = useMemo(
    () => manualMethods?.methods?.find((method) => method.public_id === selectedManualMethodPublicId) ?? null,
    [manualMethods?.methods, selectedManualMethodPublicId]
  );
  const expectedAmount = selectedPlan ? manualMethods?.prices?.[selectedPlan.id]?.[interval] ?? null : null;

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

  if (isLoading || !user || !isBootstrapped) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading...</div>;
  }

  if (user.tenant_id && !allowTenantDuringManual) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Redirecting...</div>;
  }

  if (!selectedPlan) {
    return (
      <OnboardingShell
        step="payment"
        title="Choose payment method"
        description="Step 3 of 3. You need to select a package first."
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-700">No package selected yet.</div>
            <Button className="mt-4" type="button" onClick={() => router.replace("/onboarding/plan")}>
              Go to package selection
            </Button>
          </CardContent>
        </Card>
      </OnboardingShell>
    );
  }

  const startCheckout = async () => {
    if (!user.country_id) {
      toast({
        title: "Country is required",
        description: "Please update your profile country and continue.",
        variant: "error",
      });
      return;
    }

    if (isBangladesh && !paymentSource) {
      toast({
        title: "Select payment method",
        description: "Choose Card checkout or bKash / Rocket.",
        variant: "error",
      });
      return;
    }

    const source = (isBangladesh ? paymentSource : "lemon") ?? "lemon";

    try {
      const firstPart = user.name.trim().split(/\s+/)[0] ?? "Workspace";
      const tenantName = `${firstPart} Workspace`;

      await createTenant.mutateAsync({
        tenant_name: tenantName,
        country_id: user.country_id,
        locale: user.locale ?? "en",
        skipToast: true,
      });

      if (source === "manual_mfs") {
        setAllowTenantDuringManual(true);
        await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
        setManualDialogOpen(true);
        return;
      }

      const redirectUrl = `${window.location.origin}/dashboard?billing=success`;
      const response = await checkout.mutateAsync({
        plan: selectedPlan.id,
        interval,
        redirect_url: redirectUrl,
      });

      if (response.checkout_url) {
        clearOnboardingDraft(user.email);
        window.location.href = response.checkout_url;
        return;
      }

      router.push("/settings/billing?onboarding=1");
    } catch (error) {
      toast({
        title: "Onboarding failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const price = interval === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;

  return (
    <>
    <OnboardingShell
      step="payment"
      title="Choose payment method"
      description="Step 3 of 3. Select how you want to activate billing for your selected package."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Payment path</CardTitle>
            <CardDescription>
              Trial starts now. Charge starts only after 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBangladesh ? (
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentSource("lemon")}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition",
                    paymentSource === "lemon"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4" /> Card checkout</div>
                  <p className={cn("mt-2 text-xs", paymentSource === "lemon" ? "text-slate-200" : "text-slate-600")}>Secure online checkout via Lemon Squeezy.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSource("manual_mfs")}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition",
                    paymentSource === "manual_mfs"
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-200 bg-white hover:border-teal-300"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4" /> bKash / Rocket</div>
                  <p className={cn("mt-2 text-xs", paymentSource === "manual_mfs" ? "text-teal-100" : "text-slate-600")}>Submit transaction proof for admin approval.</p>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Card checkout is enabled for your country.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/onboarding/plan")}>Back to package</Button>
              <Button type="button" onClick={startCheckout} disabled={createTenant.isPending || checkout.isPending || submitManualRequest.isPending || (isBangladesh && !paymentSource)}>
                {createTenant.isPending || checkout.isPending ? "Please wait..." : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Package</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{selectedPlan.name}</div>
              <div className="text-slate-600">{selectedPlan.storage}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Cycle</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{interval === "monthly" ? "Monthly" : "Yearly"}</div>
              <div className="text-slate-600">{price}</div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
              30-day trial: no charge today. You can cancel before trial ends.
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingShell>
    <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit bKash / Rocket payment</DialogTitle>
          <DialogDescription>
            Send the exact amount, then submit transaction details and screenshot here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {manualMethods?.methods?.map((method) => (
              <button
                key={method.public_id}
                type="button"
                onClick={() => setSelectedManualMethodPublicId(method.public_id)}
                className={cn(
                  "rounded-xl border p-3 text-left",
                  selectedManualMethodPublicId === method.public_id
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-slate-50"
                )}
              >
                <div className="text-sm font-semibold">{method.channel.toUpperCase()}</div>
                <div className={cn("text-xs", selectedManualMethodPublicId === method.public_id ? "text-teal-100" : "text-slate-600")}>
                  {method.receiver_number}
                </div>
              </button>
            ))}
          </div>

          {selectedManualMethod && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
              <div className="font-semibold">
                Send to: {selectedManualMethod.channel.toUpperCase()} {selectedManualMethod.receiver_number}
              </div>
              <p className="mt-1 text-xs">
                {selectedManualMethod.instructions_en ?? "Send exact amount and submit screenshot proof."}
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Package</label>
              <Input value={selectedPlan.name} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exact amount</label>
              <Input value={expectedAmount ? `${expectedAmount} ${manualMethods?.currency ?? "BDT"}` : ""} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sender number</label>
              <Input value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction ID</label>
              <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="TXN..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment sent at</label>
              <Input type="datetime-local" value={sentAt} onChange={(event) => setSentAt(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Screenshot</label>
              <Input type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setManualDialogOpen(false)}>Close</Button>
            <Button
              type="button"
              disabled={
                submitManualRequest.isPending ||
                !selectedPlan ||
                !expectedAmount ||
                !senderNumber.trim() ||
                !transactionId.trim() ||
                !sentAt.trim() ||
                !screenshot
              }
              onClick={async () => {
                if (!selectedPlan || !expectedAmount || !screenshot) {
                  return;
                }

                try {
                  await submitManualRequest.mutateAsync({
                    plan: selectedPlan.id,
                    interval,
                    amount: expectedAmount,
                    sender_number: senderNumber.trim(),
                    transaction_id: transactionId.trim(),
                    sent_at: sentAt,
                    screenshot,
                  });

                  clearOnboardingDraft(user.email);
                  toast({
                    title: "Manual payment submitted",
                    description: "Your request is pending admin review. Temporary access is enabled.",
                    variant: "success",
                  });
                  router.push("/dashboard?billing=manual_submitted");
                } catch (error) {
                  toast({
                    title: "Submission failed",
                    description: error instanceof Error ? error.message : "Please check details and try again.",
                    variant: "error",
                  });
                }
              }}
            >
              {submitManualRequest.isPending ? "Submitting..." : "Submit payment proof"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
