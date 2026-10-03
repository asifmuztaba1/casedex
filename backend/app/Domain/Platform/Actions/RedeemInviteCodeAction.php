<?php

namespace App\Domain\Platform\Actions;

use App\Domain\Platform\Models\InviteCode;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Uses one seat of an invite code for a new account. Runs inside the
 * registration transaction with the code row locked, so two sign-ups
 * can't both take the last seat.
 */
class RedeemInviteCodeAction
{
    public function handle(string $code, User $user): InviteCode
    {
        $invite = InviteCode::query()
            ->where('code', InviteCode::normalize($code))
            ->lockForUpdate()
            ->first();

        if ($invite === null || ! $invite->isRedeemable()) {
            throw ValidationException::withMessages(['invite_code' => __('messages.invite_code_invalid')]);
        }

        $invite->increment('uses_count');
        $user->forceFill(['invite_code_id' => $invite->id])->save();

        return $invite;
    }
}
