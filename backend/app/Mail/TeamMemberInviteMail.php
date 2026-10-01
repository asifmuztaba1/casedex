<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TeamMemberInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $temporaryPassword,
        public readonly string $loginUrl
    ) {
        $this->locale(in_array($this->user?->locale, ['en', 'bn'], true) ? $this->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject(__('emails.invite_subject'))
            ->view('emails.team-member-invite')
            ->with([
                'user' => $this->user,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl' => $this->loginUrl,
            ]);
    }
}
