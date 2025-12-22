<?php

namespace App\Policies;

use App\Domain\Cases\Models\CaseFile;
use App\Models\User;

class CasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, CaseFile $case): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $case->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, CaseFile $case): bool
    {
        return $this->view($user, $case);
    }

    public function delete(User $user, CaseFile $case): bool
    {
        return $this->view($user, $case);
    }
}
