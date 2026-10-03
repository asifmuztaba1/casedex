<?php

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Enums\AiRequestStatus;
use App\Domain\Ai\Models\AiProviderSetting;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    // The pre-admin-panel .env settings, used until an admin activates a provider.
    Config::set('services.ai.driver', 'openai_compatible');
    Config::set('services.ai.base_url', 'https://env-ai.test/v1');
    Config::set('services.ai.api_key', 'env-key');
    Config::set('services.ai.model', 'env-model');
    Config::set('billing.ai.monthly_free_credits', 100);
    Config::set('billing.ai.feature_costs', [AiFeature::HearingSummary->value => 4]);

    Http::fake([
        'https://env-ai.test/*' => Http::response(['choices' => [['message' => ['content' => 'from env']]]]),
        'https://api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => 'from groq']]]]),
        'https://generativelanguage.googleapis.com/*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => 'OK']]]]]]),
    ]);
});

function platformUser(UserRole $role = UserRole::PlatformAdmin): User
{
    return User::factory()->create(['tenant_id' => null, 'role' => $role]);
}

function saveProvider(string $provider, string $model, ?string $key): Illuminate\Testing\TestResponse
{
    return test()->putJson("/api/v1/admin/ai-providers/{$provider}", array_filter(['model' => $model, 'api_key' => $key]));
}

function runHearingSummary(): string
{
    [, $user] = createAiQaTenantUser(countryCode: 'BD', role: UserRole::Admin, withActiveSubscription: true, plan: TenantPlan::Starter);
    app('auth')->forgetGuards();

    $requestId = test()->actingAs($user)->postJson('/api/v1/ai/hearing-summary', [
        'idempotency_key' => 'admin-ai-'.uniqid(),
        'content' => 'Court resumed at 10:30. Adjourned for reply filing.',
    ])->assertSuccessful()->json('data.public_id');

    return (string) test()->getJson("/api/v1/ai/requests/{$requestId}")
        ->assertJsonPath('data.status', AiRequestStatus::Completed->value)
        ->json('data.result_text');
}

it('saves a provider without ever returning or storing the key in plain text', function (): void {
    $this->actingAs(platformUser());

    $response = saveProvider('groq', 'llama-3.3-70b-versatile', 'gsk_live_SECRET1234')->assertSuccessful();

    expect($response->getContent())->not->toContain('gsk_live_SECRET1234');
    expect($response->json('data'))->toMatchArray([
        'provider' => 'groq', 'model' => 'llama-3.3-70b-versatile', 'has_api_key' => true, 'api_key_last4' => '1234', 'is_active' => false,
    ]);
    expect(DB::table('ai_providers')->value('api_key'))->not->toContain('SECRET');
    expect($this->getJson('/api/v1/admin/ai-providers')->getContent())->not->toContain('gsk_live_SECRET1234');
});

it('keeps the saved key when only the model changes', function (): void {
    $this->actingAs(platformUser());
    saveProvider('groq', 'llama-3.3-70b-versatile', 'gsk_live_SECRET1234');

    saveProvider('groq', 'llama-3.1-8b-instant', null)->assertOk()->assertJsonPath('data.api_key_last4', '1234');

    expect(AiProviderSetting::query()->sole()->api_key)->toBe('gsk_live_SECRET1234');
});

it('uses the .env settings until an admin activates a provider, then the active one', function (): void {
    expect(runHearingSummary())->toBe('from env');

    app('auth')->forgetGuards();
    $this->actingAs(platformUser());
    saveProvider('groq', 'llama-3.3-70b-versatile', 'gsk_live_SECRET1234');
    $this->postJson('/api/v1/admin/ai-providers/groq/activate')->assertOk()->assertJsonPath('data.is_active', true);
    $this->getJson('/api/v1/admin/ai-providers')->assertJsonPath('meta.in_use', [
        'source' => 'admin:groq', 'model' => 'llama-3.3-70b-versatile', 'configured' => true,
    ]);

    expect(runHearingSummary())->toBe('from groq');
    Http::assertSent(fn (Request $request): bool => str_starts_with($request->url(), 'https://api.groq.com/openai/v1/chat/completions')
        && $request->header('Authorization') === ['Bearer gsk_live_SECRET1234']
        && $request['model'] === 'llama-3.3-70b-versatile');

    app('auth')->forgetGuards();
    $this->actingAs(platformUser());
    $this->postJson('/api/v1/admin/ai-providers/deactivate')->assertOk();
    expect(runHearingSummary())->toBe('from env');
});

it('keeps only one provider active', function (): void {
    $this->actingAs(platformUser());
    saveProvider('groq', 'llama-3.3-70b-versatile', 'gsk_live_SECRET1234');
    saveProvider('gemini', 'gemini-flash-latest', 'AIza_SECRET5678');

    $this->postJson('/api/v1/admin/ai-providers/groq/activate')->assertOk();
    $this->postJson('/api/v1/admin/ai-providers/gemini/activate')->assertOk();

    expect(AiProviderSetting::query()->where('is_active', true)->pluck('provider')->all())->toBe(['gemini']);
});

it('will not activate a provider without a key', function (): void {
    $this->actingAs(platformUser());
    saveProvider('openai', 'gpt-4.1-mini', null);

    $this->postJson('/api/v1/admin/ai-providers/openai/activate')->assertUnprocessable();
    expect(AiProviderSetting::query()->where('is_active', true)->count())->toBe(0);
});

it('tests a connection and reports failures without the key', function (): void {
    $this->actingAs(platformUser());
    saveProvider('gemini', 'gemini-flash-latest', 'AIza_SECRET5678');

    $this->postJson('/api/v1/admin/ai-providers/gemini/test')->assertOk()
        ->assertJsonPath('data.ok', true)
        ->assertJsonPath('data.reply', 'OK');
    expect(AiProviderSetting::query()->sole()->last_test_ok)->toBeTrue();

    Http::fake(['https://openrouter.ai/*' => Http::response(['error' => ['message' => 'Invalid API Key sk-or-bad-KEY9999']], 401)]);
    saveProvider('openrouter', 'openai/gpt-4.1-mini', 'sk-or-bad-KEY9999');

    $result = $this->postJson('/api/v1/admin/ai-providers/openrouter/test')->assertOk()->json('data');
    expect($result['ok'])->toBeFalse();
    expect($result['error'])->toContain('HTTP 401')->toContain('Invalid API Key')->not->toContain('sk-or-bad-KEY9999');
});

it('lets platform editors look but not change anything', function (): void {
    $this->actingAs(platformUser(UserRole::PlatformEditor));

    $this->getJson('/api/v1/admin/ai-providers')->assertOk()->assertJsonPath('meta.can_edit', false)->assertJsonCount(4, 'data');
    saveProvider('groq', 'llama-3.3-70b-versatile', 'gsk_live_SECRET1234')->assertForbidden();
    $this->postJson('/api/v1/admin/ai-providers/deactivate')->assertForbidden();
});

it('keeps workspace users out', function (): void {
    [, $lawyer] = createAiQaTenantUser(countryCode: 'BD', role: UserRole::Admin, withActiveSubscription: true, plan: TenantPlan::Starter);
    $this->actingAs($lawyer);

    $this->getJson('/api/v1/admin/ai-providers')->assertForbidden();
    saveProvider('groq', 'llama-3.3-70b-versatile', 'gsk_live_SECRET1234')->assertForbidden();
});

it('rejects unknown providers and odd model names', function (): void {
    $this->actingAs(platformUser());

    $this->putJson('/api/v1/admin/ai-providers/acme', ['model' => 'x'])->assertNotFound();
    saveProvider('groq', 'llama 3; drop table', null)->assertUnprocessable()->assertJsonValidationErrors('model');
});
