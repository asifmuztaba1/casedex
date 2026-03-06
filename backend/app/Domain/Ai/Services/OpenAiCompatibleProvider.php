<?php

namespace App\Domain\Ai\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class OpenAiCompatibleProvider implements AiProviderInterface
{
    public function complete(array $messages, array $options = []): array
    {
        $baseUrl = rtrim((string) config('services.ai.base_url', ''), '/');
        $apiKey = (string) config('services.ai.api_key', '');
        $model = (string) ($options['model'] ?? config('services.ai.model', 'gpt-4.1-mini'));

        if ($baseUrl === '' || $apiKey === '') {
            throw new \RuntimeException('AI provider is not configured.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->post($baseUrl.'/chat/completions', [
                'model' => $model,
                'temperature' => Arr::get($options, 'temperature', 0.2),
                'messages' => $messages,
            ])
            ->throw()
            ->json();

        $content = (string) Arr::get($response, 'choices.0.message.content', '');

        if ($content === '') {
            throw new \RuntimeException('AI provider returned an empty response.');
        }

        return [
            'content' => $content,
            'raw' => $response,
        ];
    }
}
