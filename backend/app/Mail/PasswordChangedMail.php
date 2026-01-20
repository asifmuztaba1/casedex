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
    }

    public function build(): self
    {
        return $this->subject('Your CaseDex™ password was updated')
            ->text('emails.password-changed')
            ->with([
                'user' => $this->user,
                'ipAddress' => $this->ipAddress,
                'changedAt' => $this->changedAt,
            ]);
    }
}
