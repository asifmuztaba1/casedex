<?php

namespace App\Policies;

use App\Domain\Auth\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function update(User $user, User $target): bool
    {
        return $user->role === UserRole::Admin && $user->tenant_id === $target->tenant_id;
    }
}
