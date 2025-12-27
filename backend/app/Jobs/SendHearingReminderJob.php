<?php

namespace App\Jobs;

use App\Domain\Notifications\Models\CaseNotification;
use App\Mail\HearingReminderMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendHearingReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $tenantId,
        public readonly int $notificationId
    ) {
    }

    public function handle(): void
    {
        $notification = CaseNotification::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId)
            ->where('id', $this->notificationId)
            ->first();

        if ($notification === null) {
            return;
        }

        if ($notification->status === 'sent') {
            return;
        }

        $user = $notification->user;

        if ($user === null) {
            return;
        }

        Mail::to($user->email)->send(new HearingReminderMail($notification));

        $notification->status = 'sent';
        $notification->sent_at = now();
        $notification->save();

        Log::info('hearings.reminder.sent', [
            'tenant_id' => $this->tenantId,
            'hearing_id' => $notification->hearing_id,
            'notification_id' => $notification->id,
        ]);
    }
}
