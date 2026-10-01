<?php

namespace App\Domain\Notifications\Push;

use App\Domain\Notifications\Models\PushSubscription;
use GuzzleHttp\Client as GuzzleClient;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Sends encrypted Web Push messages (RFC 8291) signed with the app's VAPID
 * keys to the browser push service behind each subscription endpoint.
 */
class WebPushSender implements PushSender
{
    private ?WebPush $client = null;

    public function isConfigured(): bool
    {
        return filled(config('services.webpush.public_key'))
            && filled(config('services.webpush.private_key'));
    }

    public function send(PushSubscription $subscription, array $payload): string
    {
        $report = $this->client()->sendOneNotification(
            Subscription::create([
                'endpoint' => $subscription->endpoint,
                'publicKey' => $subscription->p256dh_key,
                'authToken' => $subscription->auth_key,
                'contentEncoding' => $subscription->content_encoding ?: 'aes128gcm',
            ]),
            json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );

        if ($report->isSuccess()) {
            return self::SENT;
        }

        return $report->isSubscriptionExpired() ? self::EXPIRED : self::FAILED;
    }

    private function client(): WebPush
    {
        return $this->client ??= new WebPush(
            [
                'VAPID' => [
                    'subject' => (string) config('services.webpush.subject'),
                    'publicKey' => (string) config('services.webpush.public_key'),
                    'privateKey' => (string) config('services.webpush.private_key'),
                ],
            ],
            ['TTL' => 86400, 'urgency' => 'high'],
            new GuzzleClient(['timeout' => 30]),
        );
    }
}
