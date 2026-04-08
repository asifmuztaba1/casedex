<?php

namespace App\Jobs;

use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Notifications\Contracts\WhatsAppTransport;
use App\Mail\CaseNotificationMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DispatchCaseNotificationJob implements ShouldQueue
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

        if ($notification->channel === 'email') {
            $user = $notification->user;

            if ($user === null || empty($user->email)) {
                $notification->status = 'failed';
                $notification->save();

                Log::warning('notification.email_failed_missing_user', [
                    'tenant_id' => $this->tenantId,
                    'notification_id' => $notification->public_id,
                ]);

                return;
            }

            Mail::to($user->email)->send(new CaseNotificationMail($notification));
        } elseif ($notification->channel === 'whatsapp') {
            $user = $notification->user;

            if ($user === null || empty($user->whatsapp_phone)) {
                $notification->status = 'failed';
                $notification->save();

                Log::warning('notification.whatsapp_failed_missing_phone', [
                    'tenant_id' => $this->tenantId,
                    'notification_id' => $notification->public_id,
                ]);

                return;
            }

            $dashboardUrl = rtrim(config('app.frontend_url'), '/') . '/dashboard';
            $transport = app(WhatsAppTransport::class);
            $result = $transport->sendTemplate(
                to: $user->whatsapp_phone,
                templateName: 'case_status_update_v1',
                languageCode: $user->locale ?? 'en',
                parameters: [$dashboardUrl],
            );

            if (! $result->success) {
                $notification->status = 'failed';
                $notification->save();

                Log::warning('notification.whatsapp_send_failed', [
                    'tenant_id' => $this->tenantId,
                    'notification_id' => $notification->public_id,
                    'error' => $result->error,
                ]);

                return;
            }
        }

        $notification->status = 'sent';
        $notification->sent_at = now();
        $notification->save();

        Log::info('notification.dispatched', [
            'tenant_id' => $this->tenantId,
            'notification_id' => $notification->public_id,
        ]);
    }
}
