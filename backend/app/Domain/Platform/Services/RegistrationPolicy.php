<?php

namespace App\Domain\Platform\Services;

use App\Domain\Platform\Models\PlatformSetting;

/**
 * Whether new accounts need an invite code. Platform admins switch it in
 * Admin → Invites; until they do, REGISTRATION_MODE (default: invite) applies.
 */
class RegistrationPolicy
{
    public const INVITE = 'invite';
    public const OPEN = 'open';

    public function mode(): string
    {
        $saved = PlatformSetting::query()->where('key', 'registration_mode')->value('value');
        $mode = is_string($saved) ? $saved : (string) config('auth.registration_mode', self::INVITE);

        return in_array($mode, [self::INVITE, self::OPEN], true) ? $mode : self::INVITE;
    }

    public function requiresInvite(): bool
    {
        return $this->mode() === self::INVITE;
    }

    public function setMode(string $mode, int $adminUserId): void
    {
        PlatformSetting::query()->updateOrCreate(['key' => 'registration_mode'], ['value' => $mode, 'updated_by' => $adminUserId]);
    }
}
