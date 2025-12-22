<?php

namespace App\Policies;

use App\Domain\Notifications\Models\CaseNotification;
use App\Models\User;

class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, CaseNotification $notification): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $notification->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, CaseNotification $notification): bool
    {
        return $this->view($user, $notification);
    }

    public function delete(User $user, CaseNotification $notification): bool
    {
        return $this->view($user, $notification);
    }
}
