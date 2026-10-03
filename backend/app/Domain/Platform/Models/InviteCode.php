<?php

namespace App\Domain\Platform\Models;

use App\Models\Concerns\HasPublicId;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A private-beta invite: lets up to max_uses new accounts sign up. */
class InviteCode extends Model
{
    use HasPublicId;

    protected $fillable = ['public_id', 'code', 'label', 'max_uses', 'uses_count', 'expires_at', 'revoked_at', 'created_by'];

    protected $casts = [
        'max_uses' => 'integer',
        'uses_count' => 'integer',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    /** Codes are typed by people: case, spaces and dashes don't matter. */
    public static function normalize(string $code): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $code));
    }

    /** active | used_up | expired | revoked */
    public function status(): string
    {
        return match (true) {
            $this->revoked_at !== null => 'revoked',
            $this->expires_at !== null && $this->expires_at->isPast() => 'expired',
            $this->uses_count >= $this->max_uses => 'used_up',
            default => 'active',
        };
    }

    public function isRedeemable(): bool
    {
        return $this->status() === 'active';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'invite_code_id');
    }
}
