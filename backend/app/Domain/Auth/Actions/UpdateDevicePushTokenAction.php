<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\DeviceToken;
use Illuminate\Support\Facades\DB;

/**
 * Stores (or clears) the FCM registration token of the current device.
 *
 * A phone has one FCM token. If it was registered under another sign-in
 * (an older token, or a different user on a shared phone), that
 * registration is dropped so notifications only reach whoever is signed
 * in now.
 */
class UpdateDevicePushTokenAction
{
    public function handle(DeviceToken $token, ?string $pushToken): DeviceToken
    {
        if ($pushToken === null) {
            $token->forceFill([
                'push_token' => null,
                'push_token_hash' => null,
                'push_token_updated_at' => null,
            ])->save();

            return $token;
        }

        $hash = hash('sha256', $pushToken);

        DB::transaction(function () use ($token, $pushToken, $hash): void {
            DeviceToken::query()
                ->where('push_token_hash', $hash)
                ->whereKeyNot($token->getKey())
                ->update(['push_token' => null, 'push_token_hash' => null, 'push_token_updated_at' => null]);

            $token->forceFill([
                'push_token' => $pushToken,
                'push_token_hash' => $hash,
                'push_token_updated_at' => now(),
            ])->save();
        });

        return $token;
    }
}
