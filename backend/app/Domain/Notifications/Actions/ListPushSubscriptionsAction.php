<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Notifications\Models\PushSubscription;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Collection;

class ListPushSubscriptionsAction
{
    /**
     * @return Collection<int, PushSubscription>
     */
    public function handle(?Authenticatable $user): Collection
    {
        return PushSubscription::query()
            ->where('tenant_id', TenantContext::id())
            ->where('user_id', $user?->id)
            ->orderByDesc('created_at')
            ->get();
    }
}
