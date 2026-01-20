<?php

namespace App\Domain\Auth\Actions;

use App\Models\User;

class UpdateUserAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $target, array $data, User $actor): User
    {
        $originalEmail = $target->email;

        $target->name = $data['name'];
        $target->email = $data['email'];
        $target->role = $data['role'];
        $target->country_id = $data['country_id'];

        if (! empty($data['locale'])) {
            $target->locale = $data['locale'];
        }

        if (! empty($data['password'])) {
            $target->password = $data['password'];
        }

        if ($originalEmail !== $target->email) {
            $target->email_verified_at = null;
        }

        $target->save();

        if ($originalEmail !== $target->email) {
            $target->sendEmailVerificationNotification();
        }

        $this->auditLog->handle('user.updated', $actor, User::class, $target->public_id);

        return $target;
    }
}
