<?php

namespace App\Domain\Ai\Services;

class AiProviderFactory
{
    public function make(): AiProviderInterface
    {
        $driver = (string) config('services.ai.driver', 'openai_compatible');

        return match ($driver) {
            'gemini' => app(GeminiProvider::class),
            'openai_compatible' => app(OpenAiCompatibleProvider::class),
            default => throw new \RuntimeException('Unsupported AI provider driver: '.$driver),
        };
    }
}
