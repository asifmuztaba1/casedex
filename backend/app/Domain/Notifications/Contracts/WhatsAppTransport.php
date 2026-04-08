<?php

namespace App\Domain\Notifications\Contracts;

use App\Domain\Notifications\DataTransferObjects\WhatsAppResult;

interface WhatsAppTransport
{
    public function sendTemplate(
        string $to,
        string $templateName,
        string $languageCode,
        array $parameters = []
    ): WhatsAppResult;
}
