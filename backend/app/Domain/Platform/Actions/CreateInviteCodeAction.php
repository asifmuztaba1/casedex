<?php

namespace App\Domain\Platform\Actions;

use App\Domain\Platform\Models\InviteCode;
use App\Models\User;
use Illuminate\Support\Str;

class CreateInviteCodeAction
{
    /** No 0/O or 1/I, so codes read out over the phone aren't mistyped. */
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public function handle(User $admin, ?string $label, int $maxUses, ?int $expiresInDays): InviteCode
    {
        do {
            $code = collect(range(1, 8))->map(fn (): string => self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)])->implode('');
        } while (InviteCode::query()->where('code', $code)->exists());

        return InviteCode::query()->create([
            'code' => $code,
            'label' => $label !== null ? Str::limit($label, 120, '') : null,
            'max_uses' => $maxUses,
            'expires_at' => $expiresInDays ? now()->addDays($expiresInDays) : null,
            'created_by' => $admin->id,
        ]);
    }
}
