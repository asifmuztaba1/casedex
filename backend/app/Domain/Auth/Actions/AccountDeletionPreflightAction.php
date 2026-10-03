<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * What deleting this account would do, so the app can explain it first.
 */
class AccountDeletionPreflightAction
{
    public const GRACE_DAYS = 30;

    /**
     * @return array{can_delete: bool, blocked_reason: ?string, workspace_will_be_deleted: bool, grace_days: int}
     */
    public function handle(User $user): array
    {
        $others = $this->activeOtherMembers($user);
        $isAdmin = $user->role === UserRole::Admin;
        $handoverRequired = $user->tenant_id !== null
            && $isAdmin
            && $others->isNotEmpty()
            && $others->every(fn (User $member): bool => $member->role !== UserRole::Admin);

        return [
            'can_delete' => ! $handoverRequired,
            'blocked_reason' => $handoverRequired ? 'handover_required' : null,
            'workspace_will_be_deleted' => $user->tenant_id !== null && $others->isEmpty(),
            'grace_days' => self::GRACE_DAYS,
        ];
    }

    /**
     * Teammates who are staying: not erased and not waiting for erasure.
     *
     * @return Collection<int, User>
     */
    public function activeOtherMembers(User $user): Collection
    {
        if ($user->tenant_id === null) {
            return new Collection;
        }

        return User::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereKeyNot($user->getKey())
            ->whereNull('anonymised_at')
            ->whereNull('deletion_requested_at')
            ->get();
    }
}
