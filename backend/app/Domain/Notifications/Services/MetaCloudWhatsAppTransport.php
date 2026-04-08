<?php

namespace App\Domain\Notifications\Services;

use App\Domain\Notifications\Contracts\WhatsAppTransport;
use App\Domain\Notifications\DataTransferObjects\WhatsAppResult;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaCloudWhatsAppTransport implements WhatsAppTransport
{
    public function __construct(
        private readonly string $accessToken,
        private readonly string $phoneNumberId,
    ) {
    }

    public function sendTemplate(
        string $to,
        string $templateName,
        string $languageCode,
        array $parameters = []
    ): WhatsAppResult {
        $body = [
            'messaging_product' => 'whatsapp',
            'to' => ltrim($to, '+'),
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => [
                    'code' => $languageCode === 'bn' ? 'bn' : 'en',
                ],
            ],
        ];

        if ($parameters !== []) {
            $body['template']['components'] = [
                [
                    'type' => 'body',
                    'parameters' => array_map(
                        fn (string $value) => ['type' => 'text', 'text' => $value],
                        $parameters
                    ),
                ],
            ];
        }

        try {
            $response = Http::withToken($this->accessToken)
                ->post(
                    "https://graph.facebook.com/v21.0/{$this->phoneNumberId}/messages",
                    $body
                );

            if ($response->successful()) {
                $messageId = $response->json('messages.0.id');

                Log::info('whatsapp.sent', [
                    'to' => $to,
                    'template' => $templateName,
                    'message_id' => $messageId,
                ]);

                return new WhatsAppResult(success: true, messageId: $messageId);
            }

            $error = $response->json('error.message', 'Unknown error');

            Log::warning('whatsapp.failed', [
                'to' => $to,
                'template' => $templateName,
                'status' => $response->status(),
                'error' => $error,
            ]);

            return new WhatsAppResult(success: false, error: $error);
        } catch (\Throwable $e) {
            Log::error('whatsapp.exception', [
                'to' => $to,
                'template' => $templateName,
                'error' => $e->getMessage(),
            ]);

            return new WhatsAppResult(success: false, error: $e->getMessage());
        }
    }
}
