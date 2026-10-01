<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $resetUrl
    ) {
        $this->locale(in_array($this->user?->locale, ['en', 'bn'], true) ? $this->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject(__('emails.reset_subject'))
            ->view('emails.password-reset')
            ->with([
                'user' => $this->user,
                'resetUrl' => $this->resetUrl,
            ]);
    }
}
