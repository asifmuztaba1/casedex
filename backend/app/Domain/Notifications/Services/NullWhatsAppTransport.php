<?php

namespace App\Domain\Notifications\Services;

use App\Domain\Notifications\Contracts\WhatsAppTransport;
use App\Domain\Notifications\DataTransferObjects\WhatsAppResult;
use Illuminate\Support\Facades\Log;

class NullWhatsAppTransport implements WhatsAppTransport
{
    public function sendTemplate(
        string $to,
        string $templateName,
        string $languageCode,
        array $parameters = []
    ): WhatsAppResult {
        Log::info('whatsapp.null_transport', [
            'to' => $to,
            'template' => $templateName,
            'language' => $languageCode,
            'parameters' => $parameters,
        ]);

        return new WhatsAppResult(success: true, messageId: 'null-' . uniqid());
    }
}
