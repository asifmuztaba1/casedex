<?php

namespace App\Policies;

use App\Domain\Auth\Enums\UserRole;
use App\Models\User;

class CourtAdminPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role?->value, UserRole::platformRoles(), true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->value, UserRole::platformRoles(), true);
    }

    public function update(User $user): bool
    {
        return in_array($user->role?->value, UserRole::platformRoles(), true);
    }

    public function delete(User $user): bool
    {
        return $user->role?->value === UserRole::PlatformAdmin->value;
    }
}
