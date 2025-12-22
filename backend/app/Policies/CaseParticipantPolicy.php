<?php

namespace App\Policies;

use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Auth\Enums\UserRole;
use App\Models\User;

class CaseParticipantPolicy
{
    public function viewAny(User $user, CaseFile $case): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $case->tenant_id;
    }

    public function view(User $user, CaseParticipant $participant): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $participant->tenant_id;
    }

    public function create(User $user, CaseFile $case): bool
    {
        return $this->isAdmin($user) || $this->isLeadLawyer($user, $case);
    }

    public function update(User $user, CaseParticipant $participant): bool
    {
        return $this->isAdmin($user) || $this->isLeadLawyer($user, $participant->case);
    }

    public function delete(User $user, CaseParticipant $participant): bool
    {
        return $this->isAdmin($user) || $this->isLeadLawyer($user, $participant->case);
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === UserRole::Admin;
    }

    private function isLeadLawyer(User $user, CaseFile $case): bool
    {
        return CaseParticipant::query()
            ->where('case_id', $case->id)
            ->where('user_id', $user->id)
            ->where('role', CaseParticipantRole::LeadLawyer->value)
            ->exists();
    }
}
