<?php

namespace App\Domain\Auth\Models;

use App\Models\Concerns\HasPublicId;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * A Sanctum personal access token issued to one signed-in mobile device.
 *
 * Not tenant-scoped on purpose: tokens belong to a user (who may not have a
 * workspace yet at sign-up), and are always queried through that user.
 */
class DeviceToken extends PersonalAccessToken
{
    use HasPublicId;

    protected $table = 'personal_access_tokens';

    protected $fillable = [
        'public_id',
        'name',
        'token',
        'abilities',
        'platform',
        'expires_at',
    ];

    protected $hidden = [
        'token',
        'push_token',
        'push_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'json',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
            'push_token_updated_at' => 'datetime',
        ];
    }

    public function hasPushToken(): bool
    {
        return $this->push_token !== null;
    }
}
