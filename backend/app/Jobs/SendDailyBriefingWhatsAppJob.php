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

class SendDailyBriefingWhatsAppJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var int[] */
    public array $backoff = [60, 300];

    /**
     * @param  array<string, mixed>  $briefing  payload from BuildDailyBriefingAction
     */
    public function __construct(
        public readonly int $tenantId,
        public readonly int $notificationId,
        public readonly array $briefing
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

        // Template must be pre-approved in Meta Business Manager with 4 body params:
        //   {{1}} hearings_today, {{2}} pending_outcomes_yesterday,
        //   {{3}} cause_list_matches_today, {{4}} document_deadlines_today
        // Set WHATSAPP_DAILY_BRIEFING_TEMPLATE=daily_briefing in .env once approved.
        // If unset we skip WhatsApp gracefully; in-app bell still fires.
        $template = config('services.whatsapp.daily_briefing_template');

        if (empty($template)) {
            $notification->status = 'failed';
            $notification->save();
            Log::info('whatsapp.daily_briefing.skipped_template_unset', [
                'tenant_id' => $this->tenantId,
                'notification_id' => $notification->id,
            ]);
            return;
        }

        $parameters = [
            (string) ($this->briefing['hearings_today'] ?? 0),
            (string) ($this->briefing['pending_outcomes_yesterday'] ?? 0),
            (string) ($this->briefing['cause_list_matches_today'] ?? 0),
            (string) ($this->briefing['document_deadlines_today'] ?? 0),
        ];

        $result = $transport->sendTemplate(
            to: $user->whatsapp_phone,
            templateName: $template,
            languageCode: $user->locale ?? 'en',
            parameters: $parameters,
        );

        $notification->status = $result->success ? 'sent' : 'failed';
        $notification->sent_at = $result->success ? now() : null;
        $notification->save();

        Log::info('whatsapp.daily_briefing', [
            'tenant_id' => $this->tenantId,
            'notification_id' => $notification->id,
            'success' => $result->success,
            'message_id' => $result->messageId,
            'error' => $result->error,
        ]);
    }
}
