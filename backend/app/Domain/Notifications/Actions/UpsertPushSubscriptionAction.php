<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Notifications\Models\PushSubscription;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;

class UpsertPushSubscriptionAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, ?Authenticatable $user): PushSubscription
    {
        $endpoint = (string) $data['endpoint'];
        $endpointHash = hash('sha256', $endpoint);

        /** @var PushSubscription $subscription */
        $subscription = PushSubscription::query()->firstOrNew([
            'tenant_id' => TenantContext::id(),
            'user_id' => $user?->id,
            'endpoint_hash' => $endpointHash,
        ]);

        $subscription->fill([
            'endpoint' => $endpoint,
            'p256dh_key' => (string) $data['p256dh_key'],
            'auth_key' => (string) $data['auth_key'],
            'content_encoding' => $data['content_encoding'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'last_used_at' => now(),
        ]);
        $subscription->save();

        return $subscription;
    }
}
