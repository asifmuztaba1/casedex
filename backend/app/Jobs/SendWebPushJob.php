<?php

namespace App\Jobs;

use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Notifications\Push\PushSender;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Pushes an in-app notification to every browser the recipient opted in
 * from (Settings > notifications). Runs once: a retry could double-push.
 */
class SendWebPushJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(
        public readonly int $tenantId,
        public readonly int $notificationId
    ) {
    }

    public function handle(PushSender $sender): void
    {
        if (! $sender->isConfigured()) {
            return;
        }

        TenantContext::set($this->tenantId);

        try {
            $notification = CaseNotification::query()->with('case')->find($this->notificationId);
            if ($notification === null || $notification->user_id === null) {
                return;
            }

            $subscriptions = PushSubscription::query()
                ->where('user_id', $notification->user_id)
                ->get();
            if ($subscriptions->isEmpty()) {
                return;
            }

            $payload = [
                'title' => (string) $notification->title,
                'body' => (string) ($notification->body ?? ''),
                'url' => self::urlFor($notification),
            ];

            $counts = [PushSender::SENT => 0, PushSender::EXPIRED => 0, PushSender::FAILED => 0];
            foreach ($subscriptions as $subscription) {
                $result = $sender->send($subscription, $payload);
                $counts[$result]++;

                if ($result === PushSender::EXPIRED) {
                    // The browser unsubscribed or the endpoint is gone.
                    $subscription->delete();
                } elseif ($result === PushSender::SENT) {
                    $subscription->forceFill(['last_used_at' => now()])->save();
                }
            }

            Log::info('push.notification_sent', [
                'tenant_id' => $this->tenantId,
                'notification_id' => $notification->id,
                'notification_type' => $notification->notification_type,
            ] + $counts);
        } finally {
            TenantContext::clear();
        }
    }

    /** Where tapping the push should land in the app. */
    public static function urlFor(CaseNotification $notification): string
    {
        if ($notification->case?->public_id) {
            return '/cases/'.$notification->case->public_id;
        }

        $type = (string) $notification->notification_type;

        return match (true) {
            str_starts_with($type, 'billing_'), str_starts_with($type, 'ai_credit') => '/settings/billing',
            str_starts_with($type, 'support_') => '/support',
            default => '/notifications',
        };
    }
}
