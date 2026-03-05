<?php

namespace App\Policies;

use App\Domain\Notifications\Models\PushSubscription;
use App\Models\User;

class PushSubscriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function delete(User $user, PushSubscription $subscription): bool
    {
        return $user->tenant_id !== null
            && $user->tenant_id === $subscription->tenant_id
            && $user->id === $subscription->user_id;
    }
}
