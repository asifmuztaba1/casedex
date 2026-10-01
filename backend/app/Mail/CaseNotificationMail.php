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
        $this->locale(in_array($notification->user?->locale, ['en', 'bn'], true) ? $notification->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject($this->notification->title ?: __('emails.notification_subject_fallback'))
            ->view('emails.case-notification')
            ->with([
                'notification' => $this->notification,
            ]);
    }
}
