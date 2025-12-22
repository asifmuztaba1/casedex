<?php

namespace App\Policies;

use App\Domain\Research\Models\ResearchNote;
use App\Models\User;

class ResearchNotePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, ResearchNote $note): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $note->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, ResearchNote $note): bool
    {
        return $this->view($user, $note);
    }

    public function delete(User $user, ResearchNote $note): bool
    {
        return $this->view($user, $note);
    }
}
