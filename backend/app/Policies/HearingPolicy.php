<?php

namespace App\Policies;

use App\Domain\Hearings\Models\Hearing;
use App\Models\User;

class HearingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, Hearing $hearing): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $hearing->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, Hearing $hearing): bool
    {
        return $this->view($user, $hearing);
    }

    public function delete(User $user, Hearing $hearing): bool
    {
        return $this->view($user, $hearing);
    }
}
