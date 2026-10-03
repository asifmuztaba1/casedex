<?php

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Models\AiProviderSetting;

/**
 * Picks the AI provider for a request: the one a platform admin made active
 * in Admin → AI, or the .env settings until an admin has set one up.
 */
class AiProviderFactory
{
    public function make(): AiProviderInterface
    {
        return $this->makeFor($this->activeConfig());
    }

    public function activeConfig(): AiProviderConfig
    {
        $active = AiProviderSetting::query()->where('is_active', true)->first();

        return $active !== null && filled($active->api_key)
            ? $this->configFor($active)
            : AiProviderConfig::fromEnv();
    }

    public function configFor(AiProviderSetting $setting): AiProviderConfig
    {
        $preset = AiProviderCatalog::all()[$setting->provider]
            ?? throw new \RuntimeException('Unknown AI provider: '.$setting->provider);

        return new AiProviderConfig(
            $preset['driver'],
            $setting->base_url ?: $preset['base_url'],
            (string) $setting->api_key,
            $setting->model ?: $preset['default_model'],
            'admin:'.$setting->provider,
        );
    }

    public function makeFor(AiProviderConfig $config): AiProviderInterface
    {
        return match ($config->driver) {
            'gemini' => new GeminiProvider($config),
            'openai_compatible' => new OpenAiCompatibleProvider($config),
            default => throw new \RuntimeException('Unsupported AI provider driver: '.$config->driver),
        };
    }
}
