<?php

namespace App\Mail;

use App\Domain\Notifications\Models\CaseNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CaseNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly CaseNotification $notification)
    {
    }

    public function build(): self
    {
        return $this->subject($this->notification->title ?: 'CaseDex notification')
            ->view('emails.case-notification')
            ->with([
                'notification' => $this->notification,
            ]);
    }
}
