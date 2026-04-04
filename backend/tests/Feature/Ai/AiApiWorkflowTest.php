<?php

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Enums\AiLedgerEventType;
use App\Domain\Ai\Enums\AiRequestStatus;
use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Models\AiRequest;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('services.ai.driver', 'openai_compatible');
    Config::set('services.ai.base_url', 'https://ai.test/v1');
    Config::set('services.ai.api_key', 'test-key');
    Config::set('services.ai.model', 'test-model');
    Config::set('billing.ai.monthly_free_credits', 100);
    Config::set('billing.ai.feature_costs', [
        AiFeature::HearingSummary->value => 4,
        AiFeature::DiarySummary->value => 3,
        AiFeature::ResearchSummary->value => 5,
        AiFeature::DocumentQa->value => 2,
    ]);
});

it('completes all ai feature requests and records credit usage', function (): void {
    Http::fake([
        'https://ai.test/*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'AI QA response',
                    ],
                ],
            ],
        ]),
    ]);

    [$tenant, $user] = createAiQaTenantUser(
        countryCode: 'BD',
        role: UserRole::Admin,
        withActiveSubscription: true,
        plan: TenantPlan::Starter,
    );

    $this->actingAs($user);

    $scenarios = [
        [
            'endpoint' => '/api/v1/ai/hearing-summary',
            'feature' => AiFeature::HearingSummary->value,
            'payload' => [
                'idempotency_key' => 'ai-hearing-1',
                'content' => 'Court resumed at 10:30. Adjourned for reply filing.',
            ],
        ],
        [
            'endpoint' => '/api/v1/ai/diary-summary',
            'feature' => AiFeature::DiarySummary->value,
            'payload' => [
                'idempotency_key' => 'ai-diary-1',
                'content' => 'Met client. Need affidavit draft and certified copy.',
            ],
        ],
        [
            'endpoint' => '/api/v1/ai/research-summary',
            'feature' => AiFeature::ResearchSummary->value,
            'payload' => [
                'idempotency_key' => 'ai-research-1',
                'content' => 'Summarize limitation points and maintainability questions.',
            ],
        ],
        [
            'endpoint' => '/api/v1/ai/document-qa',
            'feature' => AiFeature::DocumentQa->value,
            'payload' => [
                'idempotency_key' => 'ai-document-1',
                'question' => 'বাংলায় বলুন, পরবর্তী তারিখ কী?',
                'context' => 'Next listed date is 12 May 2026. আদালত ১২ মে ২০২৬ তারিখ নির্ধারণ করেছে।',
            ],
        ],
    ];

    foreach ($scenarios as $scenario) {
        $response = $this->postJson($scenario['endpoint'], $scenario['payload']);

        $response->assertStatus(202);

        $publicId = $response->json('data.public_id');
        expect($publicId)->not->toBeEmpty();

        $statusResponse = $this->getJson("/api/v1/ai/requests/{$publicId}");

        $statusResponse->assertOk()
            ->assertJsonPath('data.feature', $scenario['feature'])
            ->assertJsonPath('data.status', AiRequestStatus::Completed->value)
            ->assertJsonPath('data.result_text', 'AI QA response');
    }

    $creditsResponse = $this->getJson('/api/v1/billing/ai-credits');

    $creditsResponse->assertOk()
        ->assertJsonPath('data.free_balance', 86)
        ->assertJsonPath('data.paid_balance', 0)
        ->assertJsonPath('data.total_balance', 86);

    expect(
        AiRequest::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->count()
    )->toBe(4);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Consume->value)
            ->count()
    )->toBe(4);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::FreeGrant->value)
            ->count()
    )->toBe(1);
});

it('deduplicates ai requests by idempotency key without double charging', function (): void {
    Http::fake([
        'https://ai.test/*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'Idempotent response',
                    ],
                ],
            ],
        ]),
    ]);

    [$tenant, $user] = createAiQaTenantUser();

    $this->actingAs($user);

    $payload = [
        'idempotency_key' => 'same-request-key',
        'content' => 'Repeat this hearing summary request once.',
    ];

    $first = $this->postJson('/api/v1/ai/hearing-summary', $payload);
    $second = $this->postJson('/api/v1/ai/hearing-summary', $payload);

    $first->assertStatus(202);
    $second->assertStatus(202)
        ->assertJsonPath('data.public_id', $first->json('data.public_id'));

    expect(
        AiRequest::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->count()
    )->toBe(1);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Consume->value)
            ->count()
    )->toBe(1);

    $this->getJson('/api/v1/billing/ai-credits')
        ->assertOk()
        ->assertJsonPath('data.total_balance', 96);
});

it('blocks ai requests when credits are insufficient', function (): void {
    Config::set('billing.ai.monthly_free_credits', 0);

    Http::fake([
        'https://ai.test/*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'Should never be called',
                    ],
                ],
            ],
        ]),
    ]);

    [$tenant, $user] = createAiQaTenantUser();

    $this->actingAs($user);

    $response = $this->postJson('/api/v1/ai/research-summary', [
        'idempotency_key' => 'insufficient-1',
        'content' => 'Need a research summary with no credits.',
    ]);

    $response->assertStatus(202);

    $publicId = $response->json('data.public_id');

    $this->getJson("/api/v1/ai/requests/{$publicId}")
        ->assertOk()
        ->assertJsonPath('data.status', AiRequestStatus::BlockedInsufficientCredits->value)
        ->assertJsonPath('data.error_message', 'Insufficient AI credits.');

    $this->getJson('/api/v1/billing/ai-credits')
        ->assertOk()
        ->assertJsonPath('data.total_balance', 0);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Consume->value)
            ->count()
    )->toBe(0);
});

it('refunds credits when provider execution fails', function (): void {
    Config::set('billing.ai.monthly_free_credits', 6);

    Http::fake([
        'https://ai.test/*' => Http::response(['error' => 'provider_down'], 500),
    ]);

    [$tenant, $user] = createAiQaTenantUser();

    $this->actingAs($user);

    $response = $this->postJson('/api/v1/ai/hearing-summary', [
        'idempotency_key' => 'provider-failure-1',
        'content' => 'This request should fail and refund credits.',
    ]);

    $response->assertStatus(202);

    $publicId = $response->json('data.public_id');

    $this->getJson("/api/v1/ai/requests/{$publicId}")
        ->assertOk()
        ->assertJsonPath('data.status', AiRequestStatus::Failed->value);

    $this->getJson('/api/v1/billing/ai-credits')
        ->assertOk()
        ->assertJsonPath('data.free_balance', 6)
        ->assertJsonPath('data.total_balance', 6);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Consume->value)
            ->count()
    )->toBe(1);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Refund->value)
            ->count()
    )->toBe(1);
});

it('requires an active subscription for ai endpoints', function (): void {
    Http::fake([
        'https://ai.test/*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'Should never be called',
                    ],
                ],
            ],
        ]),
    ]);

    [, $user] = createAiQaTenantUser(
        countryCode: 'BD',
        role: UserRole::Admin,
        withActiveSubscription: false,
        plan: TenantPlan::Trial,
    );

    $this->actingAs($user);

    $this->postJson('/api/v1/ai/hearing-summary', [
        'idempotency_key' => 'subscription-blocked-1',
        'content' => 'Blocked request.',
    ])->assertStatus(403)
        ->assertJsonPath('error', 'subscription_required');
});
