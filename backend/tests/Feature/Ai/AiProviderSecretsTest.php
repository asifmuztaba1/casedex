<?php

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Enums\AiRequestStatus;
use App\Domain\Ai\Models\AiRequest;
use App\Domain\Ai\Services\AiExecutionService;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

/*
 * Provider failures must never expose the platform's AI API key. Gemini used
 * to receive the key in the URL query, and HTTP client errors include the
 * URL; the job then stored that message and the API returned it to users.
 */

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('services.ai.driver', 'gemini');
    Config::set('services.ai.gemini_base_url', 'https://gemini.test/v1beta');
    Config::set('services.ai.gemini_api_key', 'SECRET-GEMINI-KEY');
    Config::set('services.ai.gemini_model', 'test-model');
    Config::set('billing.ai.monthly_free_credits', 100);
    Config::set('billing.ai.feature_costs', [AiFeature::HearingSummary->value => 4]);
});

it('sends the Gemini key in a header, not the URL', function (): void {
    Http::fake(['https://gemini.test/*' => Http::response([
        'candidates' => [['content' => ['parts' => [['text' => 'ok']]]]],
    ])]);

    app(AiExecutionService::class)->run(AiFeature::HearingSummary, ['content' => 'x']);

    Http::assertSent(fn (Request $request): bool => $request->header('x-goog-api-key') === ['SECRET-GEMINI-KEY']
        && ! str_contains($request->url(), 'SECRET-GEMINI-KEY'));
});

it('shows users a safe message and refunds credits when the provider fails', function (): void {
    Http::fake(fn () => throw new ConnectionException(
        'cURL error 28: timed out for https://gemini.test/v1beta/models/x:generateContent?key=SECRET-GEMINI-KEY'
    ));

    [, $user] = createAiQaTenantUser(
        countryCode: 'BD',
        role: UserRole::Admin,
        withActiveSubscription: true,
        plan: TenantPlan::Starter,
    );
    $user->update(['locale' => 'bn']);
    $this->actingAs($user);

    $before = $this->getJson('/api/v1/billing/ai-credits')->json('data');

    $publicId = $this->postJson('/api/v1/ai/hearing-summary', [
        'idempotency_key' => 'ai-fail-1',
        'content' => 'Court adjourned.',
    ])->json('data.public_id');

    $request = AiRequest::query()->withoutGlobalScopes()->where('public_id', $publicId)->firstOrFail();
    expect($request->status)->toBe(AiRequestStatus::Failed->value);
    expect($request->error_message)->not->toContain('SECRET-GEMINI-KEY')
        ->and($request->error_message)->toContain('কোনো ক্রেডিট কাটা হয়নি');

    $api = $this->getJson("/api/v1/ai/requests/{$publicId}");
    expect($api->getContent())->not->toContain('SECRET-GEMINI-KEY');

    expect($this->getJson('/api/v1/billing/ai-credits')->json('data'))->toEqual($before);
});

it('answers in the requester language when the request does not choose one', function (string $locale, string $expected): void {
    Http::fake(['https://gemini.test/*' => Http::response([
        'candidates' => [['content' => ['parts' => [['text' => 'ok']]]]],
    ])]);

    [, $user] = createAiQaTenantUser(
        countryCode: 'BD',
        role: UserRole::Admin,
        withActiveSubscription: true,
        plan: TenantPlan::Starter,
    );
    $user->update(['locale' => $locale]);
    $this->actingAs($user);

    $this->postJson('/api/v1/ai/hearing-summary', [
        'idempotency_key' => "ai-lang-{$locale}",
        'content' => 'Court adjourned to 14 November.',
    ])->assertSuccessful();

    Http::assertSent(fn (Request $request): bool => str_contains(
        (string) data_get($request->data(), 'systemInstruction.parts.0.text'),
        $expected
    ));
})->with([
    ['bn', 'Respond entirely in Bengali'],
    ['en', 'Respond in English'],
]);
