<?php

namespace App\Domain\Ai\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class GeminiProvider implements AiProviderInterface
{
    public function complete(array $messages, array $options = []): array
    {
        $baseUrl = rtrim((string) config('services.ai.gemini_base_url', ''), '/');
        $apiKey = (string) config('services.ai.api_key', '');
        $model = (string) ($options['model'] ?? config('services.ai.gemini_model', 'gemini-2.0-flash'));

        if ($baseUrl === '' || $apiKey === '') {
            throw new \RuntimeException('Gemini provider is not configured.');
        }

        $systemText = $this->extractMessageByRole($messages, 'system');
        $userText = $this->extractMessageByRole($messages, 'user');

        $payload = [
            'generationConfig' => [
                'temperature' => (float) Arr::get($options, 'temperature', 0.2),
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $userText],
                    ],
                ],
            ],
        ];

        if ($systemText !== '') {
            $payload['systemInstruction'] = [
                'parts' => [
                    ['text' => $systemText],
                ],
            ];
        }

        $response = Http::acceptJson()
            ->post(
                sprintf('%s/models/%s:generateContent?key=%s', $baseUrl, $model, urlencode($apiKey)),
                $payload
            )
            ->throw()
            ->json();

        $content = (string) Arr::get($response, 'candidates.0.content.parts.0.text', '');

        if ($content === '') {
            throw new \RuntimeException('Gemini provider returned an empty response.');
        }

        return [
            'content' => $content,
            'raw' => $response,
        ];
    }

    /**
     * @param array<int, array<string, string>> $messages
     */
    private function extractMessageByRole(array $messages, string $role): string
    {
        foreach ($messages as $message) {
            if (($message['role'] ?? '') === $role) {
                return (string) ($message['content'] ?? '');
            }
        }

        return '';
    }
}
