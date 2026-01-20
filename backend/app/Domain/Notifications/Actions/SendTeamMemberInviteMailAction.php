<?php

namespace App\Domain\Notifications\Actions;

use App\Mail\TeamMemberInviteMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class SendTeamMemberInviteMailAction
{
    public function handle(User $user, string $temporaryPassword): void
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $loginUrl = $frontendUrl.'/login';

        Mail::to($user->email)->queue(new TeamMemberInviteMail(
            $user,
            $temporaryPassword,
            $loginUrl
        ));
    }
}
