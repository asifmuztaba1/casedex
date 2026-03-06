<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;

class CreateCheckoutAction
{
    public function __construct(private readonly PlanFeatureService $planFeatureService)
    {
    }

    public function handle(
        Tenant $tenant,
        string $plan,
        string $interval,
        bool $addUnlimitedStorage = false,
        ?string $redirectUrl = null
    ): string {
        if ($addUnlimitedStorage) {
            $variant = (string) config('billing.addons.unlimited_storage_variant', '');
            if ($variant === '') {
                abort(422, __('messages.billing_variant_missing'));
            }

            $checkout = $tenant->checkout($variant);
            if ($redirectUrl !== null) {
                $checkout->redirectTo($redirectUrl);
            }

            return $checkout->url();
        }

        $targetPlan = TenantPlan::from($plan);
        if ($targetPlan === TenantPlan::Trial) {
            abort(422, __('messages.billing_invalid_plan'));
        }

        $variant = $this->planFeatureService->variantIdFor($targetPlan, $interval);

        if ($variant === null) {
            abort(422, __('messages.billing_variant_missing'));
        }

        $checkout = $tenant->subscribe($variant);
        if ($redirectUrl !== null) {
            $checkout->redirectTo($redirectUrl);
        }

        return $checkout->url();
    }
}
