<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\NewAccessToken;

/**
 * Mobile sign-in: checks the password and issues a device token. No session
 * is started; the app sends the token as a Bearer header from then on.
 */
class AuthenticateMobileDeviceAction
{
    public function __construct(private readonly IssueDeviceTokenAction $issueToken)
    {
    }

    /**
     * @return array{user: User, token: NewAccessToken}
     */
    public function handle(string $email, string $password, string $deviceName, ?string $platform): array
    {
        $user = User::query()->where('email', $email)->first();

        if ($user === null || ! Hash::check($password, (string) $user->password)) {
            abort(422, __('messages.invalid_credentials'));
        }

        // Long-lived tokens for platform staff would widen admin access; they
        // use the web console only.
        if (in_array($user->role?->value, UserRole::platformRoles(), true)) {
            abort(403, __('messages.mobile_platform_staff'));
        }

        return ['user' => $user, 'token' => $this->issueToken->handle($user, $deviceName, $platform)];
    }
}
