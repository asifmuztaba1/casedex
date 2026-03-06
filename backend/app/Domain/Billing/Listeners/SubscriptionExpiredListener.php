<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use LemonSqueezy\Laravel\Events\SubscriptionExpired;

class SubscriptionExpiredListener
{
    public function handle(SubscriptionExpired $event): void
    {
        if (! $event->billable instanceof Tenant) {
            return;
        }

        $event->billable->update([
            'plan' => TenantPlan::Trial,
            'trial_ends_at' => now()->subSecond(),
        ]);
    }
}
