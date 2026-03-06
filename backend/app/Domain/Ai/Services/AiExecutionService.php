<?php

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Enums\AiFeature;

class AiExecutionService
{
    public function __construct(
        private readonly AiProviderFactory $providerFactory,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{content: string, raw: array<string, mixed>}
     */
    public function run(AiFeature $feature, array $payload): array
    {
        $provider = $this->providerFactory->make();

        $messages = [
            [
                'role' => 'system',
                'content' => $this->systemPrompt($feature),
            ],
            [
                'role' => 'user',
                'content' => $this->userPrompt($feature, $payload),
            ],
        ];

        return $provider->complete($messages);
    }

    private function systemPrompt(AiFeature $feature): string
    {
        return match ($feature) {
            AiFeature::HearingSummary => 'You are an assistant for legal professionals. Summarize hearing notes in clear bullet points. No legal advice.',
            AiFeature::DiarySummary => 'You are an assistant for legal professionals. Rewrite diary notes into concise structured summary. No legal advice.',
            AiFeature::ResearchSummary => 'You summarize provided legal research notes without making legal recommendations.',
            AiFeature::DocumentQa => 'Answer strictly from provided document excerpts. If unknown, say not found in source.',
        };
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function userPrompt(AiFeature $feature, array $payload): string
    {
        return match ($feature) {
            AiFeature::HearingSummary => "Hearing content:\n".(string) ($payload['content'] ?? ''),
            AiFeature::DiarySummary => "Diary content:\n".(string) ($payload['content'] ?? ''),
            AiFeature::ResearchSummary => "Research note content:\n".(string) ($payload['content'] ?? ''),
            AiFeature::DocumentQa => "Question:\n".(string) ($payload['question'] ?? '')."\n\nDocument context:\n".(string) ($payload['context'] ?? ''),
        };
    }
}
