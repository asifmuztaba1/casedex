<?php

namespace App\Jobs;

use App\Domain\Auth\Models\DeviceToken;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Notifications\Push\MobilePushSender;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Pushes an in-app notification to every mobile device the recipient is
 * signed in on and has registered for push. Runs once: a retry could
 * double-push.
 */
class SendMobilePushJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(
        public readonly int $tenantId,
        public readonly int $notificationId
    ) {
    }

    public function handle(MobilePushSender $sender): void
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

            $devices = DeviceToken::query()
                ->where('tokenable_type', (new User)->getMorphClass())
                ->where('tokenable_id', $notification->user_id)
                ->whereNotNull('push_token')
                ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->get();
            if ($devices->isEmpty()) {
                return;
            }

            $payload = self::payloadFor($notification);

            $counts = [MobilePushSender::SENT => 0, MobilePushSender::EXPIRED => 0, MobilePushSender::FAILED => 0];
            foreach ($devices as $device) {
                $result = $sender->send((string) $device->push_token, $payload);
                $counts[$result]++;

                if ($result === MobilePushSender::EXPIRED) {
                    // App uninstalled or FCM token rotated; the app re-registers on next launch.
                    $device->forceFill(['push_token' => null, 'push_token_hash' => null, 'push_token_updated_at' => null])->save();
                }
            }

            Log::info('push.mobile_sent', [
                'tenant_id' => $this->tenantId,
                'notification_id' => $notification->id,
                'notification_type' => $notification->notification_type,
            ] + $counts);
        } finally {
            TenantContext::clear();
        }
    }

    /**
     * @return array{title: string, body: string, url: string, data: array<string, string>}
     */
    public static function payloadFor(CaseNotification $notification): array
    {
        return [
            'title' => (string) $notification->title,
            'body' => (string) ($notification->body ?? ''),
            // Same path as the web app; the mobile app maps it to a screen.
            'url' => SendWebPushJob::urlFor($notification),
            'data' => array_filter([
                'notification_public_id' => (string) $notification->public_id,
                'notification_type' => (string) ($notification->notification_type ?? 'general'),
                'case_public_id' => (string) ($notification->case?->public_id ?? ''),
            ], fn (string $value): bool => $value !== ''),
        ];
    }
}
