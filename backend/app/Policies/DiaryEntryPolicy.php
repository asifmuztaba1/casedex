<?php

namespace App\Policies;

use App\Domain\Diary\Models\DiaryEntry;
use App\Models\User;

class DiaryEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, DiaryEntry $entry): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $entry->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, DiaryEntry $entry): bool
    {
        return $this->view($user, $entry);
    }

    public function delete(User $user, DiaryEntry $entry): bool
    {
        return $this->view($user, $entry);
    }
}
