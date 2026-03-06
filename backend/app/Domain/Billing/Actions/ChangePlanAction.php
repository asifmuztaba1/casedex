<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use LemonSqueezy\Laravel\Subscription;

class ChangePlanAction
{
    public function __construct(private readonly PlanFeatureService $planFeatureService)
    {
    }

    public function handle(Tenant $tenant, string $plan, string $interval): Subscription
    {
        $subscription = $tenant->subscription();

        if ($subscription === null) {
            abort(422, __('messages.billing_subscription_missing'));
        }

        $targetPlan = TenantPlan::from($plan);
        if ($targetPlan === TenantPlan::Trial) {
            abort(422, __('messages.billing_invalid_plan'));
        }

        $variant = $this->planFeatureService->variantIdFor($targetPlan, $interval);
        if ($variant === null) {
            abort(422, __('messages.billing_variant_missing'));
        }

        return $subscription->swap((string) $subscription->product_id, $variant);
    }
}
