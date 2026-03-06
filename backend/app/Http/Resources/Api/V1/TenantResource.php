<?php

namespace App\Http\Resources\Api\V1;

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
        $subscription = $this->subscription();

        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'plan' => $this->plan?->value,
            'has_active_subscription' => $planFeatures->hasActiveSubscription($this->resource),
            'subscription_status' => $subscription?->status ?? ($planFeatures->isTrialExpired($this->resource) ? 'expired' : 'on_trial'),
            'on_trial' => ! $planFeatures->isTrialExpired($this->resource) && ! $planFeatures->hasActiveSubscription($this->resource),
            'trial_ends_at' => $this->trial_ends_at,
            'on_grace_period' => $subscription?->onGracePeriod() ?? false,
            'plan_limits' => $planFeatures->planLimits($this->resource),
            'country_id' => $this->country_id,
            'country' => $this->country?->name,
            'country_code' => $this->country?->code,
            'locale' => $this->locale,
        ];
    }
}
