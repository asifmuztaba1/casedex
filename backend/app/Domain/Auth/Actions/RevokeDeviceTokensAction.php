<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\DeviceToken;
use App\Models\User;

/**
 * Signs a user out of every mobile device, optionally keeping one (the
 * device that asked). Used for "sign out everywhere" and after a password
 * change, so a leaked password stops working on phones too.
 */
class RevokeDeviceTokensAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(User $user, ?DeviceToken $keep, string $reason): int
    {
        $query = $user->tokens();
        if ($keep !== null) {
            $query->whereKeyNot($keep->getKey());
        }

        $revoked = $query->delete();

        if ($revoked > 0) {
            $this->auditLog->handle('auth.devices_revoked', $user, User::class, $user->public_id, [
                'channel' => 'mobile',
                'reason' => $reason,
                'count' => $revoked,
            ]);
        }

        return $revoked;
    }
}
