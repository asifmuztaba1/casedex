<?php

namespace App\Domain\Notifications\Push;

interface MobilePushSender
{
    public const SENT = 'sent';
    public const EXPIRED = 'expired';
    public const FAILED = 'failed';

    /** Credentials are present; without them nothing is sent. */
    public function isConfigured(): bool;

    /**
     * @param  array{title: string, body: string, url: string, data: array<string, string>}  $payload
     * @return self::SENT|self::EXPIRED|self::FAILED
     */
    public function send(string $pushToken, array $payload): string;
}
