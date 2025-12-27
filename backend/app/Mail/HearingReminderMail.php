<?php

namespace App\Mail;

use App\Domain\Notifications\Models\CaseNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HearingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly CaseNotification $notification)
    {
    }

    public function build(): self
    {
        return $this->subject('Hearing reminder')
            ->text('emails.hearing-reminder')
            ->with([
                'notification' => $this->notification,
            ]);
    }
}
