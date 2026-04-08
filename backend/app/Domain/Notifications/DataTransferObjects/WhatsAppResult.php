<?php

namespace App\Domain\Notifications\DataTransferObjects;

readonly class WhatsAppResult
{
    public function __construct(
        public bool $success,
        public ?string $messageId = null,
        public ?string $error = null,
    ) {
    }
}
