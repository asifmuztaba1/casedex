<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Tenancy\Models\Tenant;
use LemonSqueezy\Laravel\Subscription;

class ResumeSubscriptionAction
{
    public function handle(Tenant $tenant): Subscription
    {
        $subscription = $tenant->subscription();

        if ($subscription === null) {
            abort(422, __('messages.billing_subscription_missing'));
        }

        return $subscription->resume();
    }
}
