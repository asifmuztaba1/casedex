<?php

namespace App\Domain\Auth\Actions;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ListUsersAction
{
    /**
     * @return Collection<int, User>
     */
    public function handle(User $actor): Collection
    {
        return User::query()
            ->with(['tenant', 'country'])
            ->where('tenant_id', $actor->tenant_id)
            ->whereNull('anonymised_at')
            ->orderByDesc('created_at')
            ->get();
    }
}
