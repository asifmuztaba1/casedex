<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Tenancy\Models\Tenant;
use LemonSqueezy\Laravel\Events\SubscriptionCancelled;

class SubscriptionCancelledListener
{
    public function handle(SubscriptionCancelled $event): void
    {
        if (! $event->billable instanceof Tenant) {
            return;
        }

        if ($event->subscription->onGracePeriod()) {
            return;
        }

        $event->billable->update([
            'trial_ends_at' => now()->subSecond(),
        ]);
    }
}
