<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\DeviceToken;
use App\Models\User;

/**
 * Signs a device out: the token stops working and its push registration
 * goes with it.
 */
class RevokeDeviceTokenAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(DeviceToken $token, User $actor, string $auditAction): void
    {
        $this->auditLog->handle($auditAction, $actor, DeviceToken::class, $token->public_id, [
            'channel' => 'mobile',
            'device' => (string) $token->name,
            'platform' => $token->platform,
        ]);

        $token->delete();
    }
}
