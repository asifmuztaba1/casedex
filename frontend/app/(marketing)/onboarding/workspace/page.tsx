"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import OnboardingShell from "@/components/onboarding-shell";
import { useAuth, useCreateTenant } from "@/features/auth/use-auth";
import { clearOnboardingDraft } from "@/features/auth/onboarding-draft";
import { ArrowRight, CalendarClock, Rocket } from "lucide-react";

export default function OnboardingWorkspacePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user, isLoading } = useAuth();
  const createTenant = useCreateTenant();
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tenant_id) {
      const hasWorkspaceAccess = user.tenant?.has_workspace_access ?? user.tenant?.has_active_subscription ?? false;
      router.replace(hasWorkspaceAccess ? "/dashboard" : "/settings/billing?onboarding=1");
      return;
    }

    if (!user.email_verified_at) {
      router.replace("/onboarding/account");
      return;
    }

    if (!workspaceName) {
      const firstPart = user.name.trim().split(/\s+/)[0] ?? "My";
      setWorkspaceName(`${firstPart}'s Workspace`);
    }
  }, [isLoading, router, user, workspaceName]);

  if (isLoading || !user || user.tenant_id) {
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6 text-sm text-[var(--muted)]">Loading...</div>;
  }

  const startTrial = async () => {
    const name = workspaceName.trim();
    if (!name) {
      toast({
        title: "Workspace name required",
        description: "Please enter a name for your workspace.",
        variant: "error",
      });
      return;
    }

    if (!user.country_id) {
      toast({
        title: "Country is required",
        description: "Please update your profile country and try again.",
        variant: "error",
      });
      return;
    }

    try {
      await createTenant.mutateAsync({
        tenant_name: name,
        country_id: user.country_id,
        plan: "starter",
        locale: user.locale ?? "en",
        skipToast: true,
      });

      clearOnboardingDraft(user.email);
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast({
        title: "Welcome to CaseDex!",
        description: "Your 30-day free trial has started.",
        variant: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <OnboardingShell
      step="workspace"
      title="Set up your workspace"
      description="Step 2 of 2. Name your workspace and start your 30-day free trial."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-5 w-5 text-[var(--muted)]" />
            Almost there
          </CardTitle>
          <CardDescription>
            Your workspace is where your team manages cases, hearings, documents, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Workspace name
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Rahman & Associates"
            />
            <p className="text-xs text-[var(--muted-soft)]">
              You can change this later in Settings.
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex items-center gap-2 font-semibold">
              <CalendarClock className="h-4 w-4" />
              30-day free trial
            </div>
            <p className="mt-1">
              Full access to all features. No credit card required. You can choose a plan when the trial ends.
            </p>
          </div>

          <Button
            type="button"
            onClick={startTrial}
            disabled={createTenant.isPending}
            className="w-full sm:w-auto"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            {createTenant.isPending ? "Creating workspace..." : "Start free trial"}
          </Button>
        </CardContent>
      </Card>
    </OnboardingShell>
  );
}
