<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Notifications\Models\PushSubscription;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;

class DeletePushSubscriptionAction
{
    public function handle(string $endpointHash, ?Authenticatable $user): void
    {
        $subscription = PushSubscription::query()
            ->where('tenant_id', TenantContext::id())
            ->where('user_id', $user?->id)
            ->where('endpoint_hash', $endpointHash)
            ->firstOrFail();

        $subscription->delete();
    }
}
