<?php

namespace App\Domain\Ai\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class OpenAiCompatibleProvider implements AiProviderInterface
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
            throw new \RuntimeException('AI provider is not configured. Add an API key in Admin → AI.');
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
