<?php

namespace App\Domain\Ai\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class GeminiProvider implements AiProviderInterface
{
    /** Without a config (e.g. resolved from the container) the .env settings are used. */
    public function __construct(private readonly ?AiProviderConfig $config = null)
    {
    }

    public function complete(array $messages, array $options = []): array
    {
        $config = $this->config ?? AiProviderConfig::fromEnv();
        $baseUrl = rtrim($config->baseUrl, '/');
        $apiKey = $config->apiKey;
        $model = (string) ($options['model'] ?? $config->model);

        if ($baseUrl === '' || $apiKey === '') {
            throw new \RuntimeException('Gemini provider is not configured. Add an API key in Admin → AI.');
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

        // Key goes in a header, never the URL: HTTP client errors include the
        // full URL, and those messages can reach logs or users.
        $response = Http::acceptJson()
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->post(
                sprintf('%s/models/%s:generateContent', $baseUrl, $model),
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
