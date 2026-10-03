<?php

namespace App\Mail;

use App\Models\User;
use App\Support\LocalizedDate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountDeletionScheduledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly bool $workspaceWillBeDeleted
    ) {
        $this->locale(in_array($this->user->locale, ['en', 'bn'], true) ? $this->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject(__('emails.deletion_scheduled_subject'))
            ->view('emails.account-deletion-scheduled')
            ->with([
                'user' => $this->user,
                'deleteOn' => LocalizedDate::date($this->user->deletion_scheduled_for, $this->locale),
                'workspaceWillBeDeleted' => $this->workspaceWillBeDeleted,
                'signInUrl' => rtrim((string) config('app.frontend_url'), '/').'/login',
            ]);
    }
}
