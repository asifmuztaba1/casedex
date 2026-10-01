<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $ipAddress,
        public readonly string $changedAt
    ) {
        $this->locale(in_array($this->user?->locale, ['en', 'bn'], true) ? $this->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject(__('emails.password_changed_subject'))
            ->view('emails.password-changed')
            ->with([
                'user' => $this->user,
                'ipAddress' => $this->ipAddress,
                'changedAt' => $this->changedAt,
            ]);
    }
}
