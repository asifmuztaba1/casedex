<?php

namespace App\Policies;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Domain\Cases\Models\CaseParticipant;
use App\Models\User;

class CasePartyPolicy
{
    public function viewAny(User $user, CaseFile $case): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $case->tenant_id;
    }

    public function view(User $user, CaseParty $party): bool
    {
        return $user->tenant_id !== null && $user->tenant_id === $party->tenant_id;
    }

    public function create(User $user, CaseFile $case): bool
    {
        return $this->isAdmin($user) || $this->isLeadLawyer($user, $case);
    }

    public function update(User $user, CaseParty $party): bool
    {
        return $this->isAdmin($user) || $this->isLeadLawyer($user, $party->case);
    }

    public function delete(User $user, CaseParty $party): bool
    {
        return $this->isAdmin($user) || $this->isLeadLawyer($user, $party->case);
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
