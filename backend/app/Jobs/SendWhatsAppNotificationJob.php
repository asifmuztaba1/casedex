<?php

namespace App\Jobs;

use App\Domain\Notifications\Contracts\WhatsAppTransport;
use App\Domain\Notifications\Models\CaseNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var int[] */
    public array $backoff = [60, 300];

    public function __construct(
        public readonly int $tenantId,
        public readonly int $notificationId
    ) {
    }

    public function handle(WhatsAppTransport $transport): void
    {
        $notification = CaseNotification::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId)
            ->where('id', $this->notificationId)
            ->first();

        if ($notification === null || $notification->status === 'sent') {
            return;
        }

        $user = $notification->user;

        if ($user === null || empty($user->whatsapp_phone)) {
            $notification->status = 'failed';
            $notification->save();
            return;
        }

        $dashboardUrl = rtrim(config('app.frontend_url'), '/') . '/dashboard';

        $result = $transport->sendTemplate(
            to: $user->whatsapp_phone,
            templateName: 'hearing_reminder_v1',
            languageCode: $user->locale ?? 'en',
            parameters: [$dashboardUrl],
        );

        $notification->status = $result->success ? 'sent' : 'failed';
        $notification->sent_at = $result->success ? now() : null;
        $notification->save();

        Log::info('whatsapp.hearing_reminder', [
            'tenant_id' => $this->tenantId,
            'notification_id' => $notification->id,
            'success' => $result->success,
            'message_id' => $result->messageId,
            'error' => $result->error,
        ]);
    }
}
