<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Models\Tenant;
use LemonSqueezy\Laravel\Events\SubscriptionCreated;

class SubscriptionCreatedListener
{
    public function __construct(private readonly PlanFeatureService $planFeatureService)
    {
    }

    public function handle(SubscriptionCreated $event): void
    {
        if (! $event->billable instanceof Tenant) {
            return;
        }

        $event->billable->update([
            'plan' => $this->planFeatureService->resolvePlanFromVariant((string) $event->subscription->variant_id),
            'trial_ends_at' => null,
        ]);
    }
}
