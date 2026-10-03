<?php

namespace App\Domain\Auth\Actions;

use App\Mail\AccountDeletionCancelledMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

/**
 * Signing in during the grace period keeps the account. The owner is
 * emailed, so a sign-in they didn't make is noticed.
 */
class CancelAccountDeletionAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /** @return bool whether a pending deletion was cancelled */
    public function handle(User $user): bool
    {
        if (! $user->isDeletionPending()) {
            return false;
        }

        $user->forceFill(['deletion_requested_at' => null, 'deletion_scheduled_for' => null])->save();

        $this->auditLog->handle('account.deletion_cancelled', $user, User::class, $user->public_id);
        Mail::to($user->email)->queue(new AccountDeletionCancelledMail($user));

        return true;
    }
}
