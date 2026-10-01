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
        $this->locale(in_array($notification->user?->locale, ['en', 'bn'], true) ? $notification->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject(__('emails.hearing_reminder_subject'))
            ->view('emails.hearing-reminder')
            ->with([
                'notification' => $this->notification,
            ]);
    }
}
