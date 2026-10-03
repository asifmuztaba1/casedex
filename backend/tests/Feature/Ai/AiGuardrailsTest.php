<?php

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Services\AiExecutionService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/**
 * AGENTS.md §11: every AI feature drafts for a lawyer and never predicts
 * outcomes or invents sources. The rules go to the model with each request.
 */
it('sends the guardrails with every AI feature', function (AiFeature $feature): void {
    Config::set('services.ai.driver', 'openai_compatible');
    Config::set('services.ai.base_url', 'https://ai.test/v1');
    Config::set('services.ai.api_key', 'test-key');
    Config::set('services.ai.model', 'test-model');
    Http::fake(['https://ai.test/*' => Http::response(['choices' => [['message' => ['content' => 'draft']]]])]);

    app(AiExecutionService::class)->run($feature, ['content' => 'Facts provided by the lawyer.', 'language' => 'en']);

    Http::assertSent(function (Request $request): bool {
        $system = collect($request['messages'])->firstWhere('role', 'system')['content'] ?? '';

        return str_contains($system, 'Never predict the outcome of a case')
            && str_contains($system, 'Do not invent facts, parties, dates, sections, cases or citations')
            && str_contains($system, 'never legal advice to a client');
    });
})->with(fn (): array => array_map(fn (AiFeature $f): array => [$f], AiFeature::cases()));
