<?php

namespace App\Domain\Ai\Services;

/** Everything a provider needs for one call; built from Admin → AI or .env. */
final class AiProviderConfig
{
    public function __construct(
        public readonly string $driver,
        public readonly string $baseUrl,
        public readonly string $apiKey,
        public readonly string $model,
        /** admin:<provider> or env */
        public readonly string $source,
    ) {
    }

    /** The pre-admin-panel configuration from .env (services.ai). */
    public static function fromEnv(): self
    {
        $driver = (string) config('services.ai.driver', 'openai_compatible');

        return $driver === 'gemini'
            ? new self('gemini', (string) config('services.ai.gemini_base_url', ''), (string) config('services.ai.gemini_api_key', ''), (string) config('services.ai.gemini_model', 'gemini-flash-latest'), 'env')
            : new self($driver, (string) config('services.ai.base_url', ''), (string) config('services.ai.api_key', ''), (string) config('services.ai.model', 'gpt-4.1-mini'), 'env');
    }
}
