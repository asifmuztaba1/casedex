<?php

namespace App\Domain\Ai\Services;

/**
 * Providers an admin can choose from. Groq, OpenAI and OpenRouter all speak
 * the OpenAI chat-completions API; Gemini has its own driver.
 */
final class AiProviderCatalog
{
    /**
     * @return array<string, array{label: string, driver: string, base_url: string, default_model: string, suggested_models: array<int, string>, key_url: string}>
     */
    public static function all(): array
    {
        return [
            'gemini' => [
                'label' => 'Google Gemini',
                'driver' => 'gemini',
                'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
                'default_model' => 'gemini-flash-latest',
                'suggested_models' => ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-flash-lite-latest'],
                'key_url' => 'https://aistudio.google.com/apikey',
            ],
            'groq' => [
                'label' => 'Groq',
                'driver' => 'openai_compatible',
                'base_url' => 'https://api.groq.com/openai/v1',
                'default_model' => 'llama-3.3-70b-versatile',
                'suggested_models' => ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
                'key_url' => 'https://console.groq.com/keys',
            ],
            'openai' => [
                'label' => 'OpenAI',
                'driver' => 'openai_compatible',
                'base_url' => 'https://api.openai.com/v1',
                'default_model' => 'gpt-4.1-mini',
                'suggested_models' => ['gpt-4.1-mini', 'gpt-4.1'],
                'key_url' => 'https://platform.openai.com/api-keys',
            ],
            'openrouter' => [
                'label' => 'OpenRouter',
                'driver' => 'openai_compatible',
                'base_url' => 'https://openrouter.ai/api/v1',
                'default_model' => 'openai/gpt-4.1-mini',
                'suggested_models' => ['openai/gpt-4.1-mini', 'anthropic/claude-sonnet-4.5', 'google/gemini-2.5-flash'],
                'key_url' => 'https://openrouter.ai/keys',
            ],
        ];
    }

    /** @return array<int, string> */
    public static function keys(): array
    {
        return array_keys(self::all());
    }
}
