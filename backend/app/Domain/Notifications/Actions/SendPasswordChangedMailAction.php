<?php

namespace App\Domain\Notifications\Actions;

use App\Mail\PasswordChangedMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class SendPasswordChangedMailAction
{
    public function handle(User $user, string $ipAddress): void
    {
        Mail::to($user->email)->queue(new PasswordChangedMail(
            $user,
            $ipAddress,
            now()->toDateTimeString()
        ));
    }
}
