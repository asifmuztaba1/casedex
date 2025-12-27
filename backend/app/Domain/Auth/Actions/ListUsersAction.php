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
            ->where('tenant_id', $actor->tenant_id)
            ->orderByDesc('created_at')
            ->get();
    }
}
