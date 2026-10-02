<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\DeviceToken;
use App\Models\User;
use Laravel\Sanctum\NewAccessToken;

/**
 * Issues a bearer token for one mobile device. The plain-text token is only
 * available on the returned object; the database keeps its hash.
 */
class IssueDeviceTokenAction
{
    public const ABILITY = 'mobile';

    public function handle(User $user, string $deviceName, ?string $platform): NewAccessToken
    {
        $ttlDays = max(1, (int) config('services.mobile.token_ttl_days', 60));

        $newToken = $user->createToken($deviceName, [self::ABILITY], now()->addDays($ttlDays));

        /** @var DeviceToken $token */
        $token = $newToken->accessToken;
        $token->forceFill(['platform' => $platform])->save();

        return $newToken;
    }
}
