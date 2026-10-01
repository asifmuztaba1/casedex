<?php

namespace App\Domain\Notifications\Push;

use App\Domain\Notifications\Models\PushSubscription;

interface PushSender
{
    public const SENT = 'sent';
    public const EXPIRED = 'expired';
    public const FAILED = 'failed';

    /** VAPID keys are present; without them nothing is sent. */
    public function isConfigured(): bool;

    /**
     * @param  array{title: string, body: string, url: string}  $payload
     * @return self::SENT|self::EXPIRED|self::FAILED
     */
    public function send(PushSubscription $subscription, array $payload): string;
}
