<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;

class GetSubscriptionStateAction
{
    public function __construct(private readonly PlanFeatureService $planFeatureService)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function handle(Tenant $tenant): array
    {
        $subscription = $tenant->subscription();
        $plan = $tenant->plan ?? TenantPlan::Trial;

        return [
            'status' => $subscription?->status ?? ($this->planFeatureService->isTrialExpired($tenant) ? 'expired' : 'on_trial'),
            'plan' => $plan->value,
            'on_trial' => ! $this->planFeatureService->isTrialExpired($tenant) && ! $this->planFeatureService->hasActiveSubscription($tenant),
            'trial_ends_at' => $tenant->trial_ends_at,
            'on_grace_period' => $subscription?->onGracePeriod() ?? false,
            'renews_at' => $subscription?->renews_at,
            'ends_at' => $subscription?->ends_at,
            'variant_id' => $subscription?->variant_id,
            'product_id' => $subscription?->product_id,
            'plan_limits' => $this->planFeatureService->planLimits($tenant),
        ];
    }
}
