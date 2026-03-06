<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;

class GetSubscriptionStateAction
{
    public function __construct(
        private readonly PlanFeatureService $planFeatureService,
        private readonly AiCreditService $aiCreditService
    )
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function handle(Tenant $tenant): array
    {
        $subscription = $tenant->subscription();
        $plan = $tenant->plan ?? TenantPlan::Trial;
        $manualApproved = $this->planFeatureService->hasManualApprovedAccess($tenant);
        $manualPending = $this->planFeatureService->hasManualPendingAccess($tenant);
        $isTrialExpired = $this->planFeatureService->isTrialExpired($tenant);

        return [
            'status' => $subscription?->status
                ?? ($manualApproved ? 'active' : ($manualPending ? 'pending' : ($isTrialExpired ? 'expired' : 'on_trial'))),
            'plan' => $plan->value,
            'on_trial' => ! $isTrialExpired
                && ! $this->planFeatureService->hasPaidSubscription($tenant)
                && ! $manualPending,
            'trial_ends_at' => $tenant->trial_ends_at,
            'on_grace_period' => $subscription?->onGracePeriod() ?? false,
            'renews_at' => $subscription?->renews_at,
            'ends_at' => $subscription?->ends_at,
            'variant_id' => $subscription?->variant_id,
            'product_id' => $subscription?->product_id,
            'has_active_subscription' => $this->planFeatureService->hasPaidSubscription($tenant),
            'has_access' => $this->planFeatureService->hasAccess($tenant),
            'billing_source' => $this->planFeatureService->billingSource($tenant),
            'manual_status' => $this->planFeatureService->manualStatus($tenant),
            'temporary_access_expires_at' => $this->planFeatureService->temporaryAccessExpiresAt($tenant),
            'plan_limits' => $this->planFeatureService->planLimits($tenant),
            'ai_wallet' => $this->aiCreditService->walletSummary($tenant),
        ];
    }
}
