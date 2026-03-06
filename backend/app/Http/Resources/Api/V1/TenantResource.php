<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Billing\Services\PlanFeatureService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $planFeatures = app(PlanFeatureService::class);
        $aiCreditService = app(AiCreditService::class);
        $subscription = $this->subscription();
        $manualApproved = $planFeatures->hasManualApprovedAccess($this->resource);
        $manualPending = $planFeatures->hasManualPendingAccess($this->resource);
        $isTrialExpired = $planFeatures->isTrialExpired($this->resource);

        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'plan' => $this->plan?->value,
            'has_active_subscription' => $planFeatures->hasPaidSubscription($this->resource),
            'has_workspace_access' => $planFeatures->hasAccess($this->resource),
            'billing_source' => $planFeatures->billingSource($this->resource),
            'manual_status' => $planFeatures->manualStatus($this->resource),
            'temporary_access_expires_at' => $planFeatures->temporaryAccessExpiresAt($this->resource),
            'subscription_status' => $subscription?->status
                ?? ($manualApproved ? 'active' : ($manualPending ? 'pending' : ($isTrialExpired ? 'expired' : 'on_trial'))),
            'on_trial' => ! $isTrialExpired
                && ! $planFeatures->hasPaidSubscription($this->resource)
                && ! $manualPending,
            'trial_ends_at' => $this->trial_ends_at,
            'on_grace_period' => $subscription?->onGracePeriod() ?? false,
            'plan_limits' => $planFeatures->planLimits($this->resource),
            'ai_wallet' => $aiCreditService->walletSummary($this->resource),
            'country_id' => $this->country_id,
            'country' => $this->country?->name,
            'country_code' => $this->country?->code,
            'locale' => $this->locale,
        ];
    }
}
