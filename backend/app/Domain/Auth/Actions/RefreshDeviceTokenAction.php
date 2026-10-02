<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\DeviceToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\NewAccessToken;

/**
 * Swaps the current device token for a new one with a fresh expiry. The
 * push registration moves with it and the old token stops working.
 */
class RefreshDeviceTokenAction
{
    public function __construct(private readonly IssueDeviceTokenAction $issueToken)
    {
    }

    public function handle(User $user, DeviceToken $current): NewAccessToken
    {
        return DB::transaction(function () use ($user, $current): NewAccessToken {
            $newToken = $this->issueToken->handle($user, (string) $current->name, $current->platform);

            /** @var DeviceToken $replacement */
            $replacement = $newToken->accessToken;
            $push = $current->only(['push_token', 'push_token_hash', 'push_token_updated_at']);

            $current->delete();
            if ($push['push_token'] !== null) {
                $replacement->forceFill($push)->save();
            }

            return $newToken;
        });
    }
}
