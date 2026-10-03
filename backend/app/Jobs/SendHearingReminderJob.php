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
use App\Support\TenantContext;

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
        // Queue workers have no request tenant; scope this job to its own tenant
        // so tenant-scoped models (case, hearing) used by mail views resolve.
        TenantContext::set($this->tenantId);

        try {
            $this->process();
        } finally {
            TenantContext::clear();
        }
    }

    private function process(): void
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

        // Nobody to email, or the account is being deleted.
        if ($user === null || ! $user->canReceiveMessages()) {
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
