<?php

use App\Domain\Ai\Enums\AiLedgerEventType;
use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Models\AiCreditWallet;
use App\Domain\Ai\Models\AiManualPaymentRequest;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('returns ai balance, pack catalog, and alert rules for a tenant', function (): void {
    seedAiQaCreditPack();
    seedAiQaManualMethod();

    [$tenant, $user] = createAiQaTenantUser(
        countryCode: 'BD',
        role: UserRole::Admin,
        withActiveSubscription: true,
        plan: TenantPlan::Starter,
    );

    seedAiQaAlertRule($tenant);

    $this->actingAs($user);

    $this->getJson('/api/v1/billing/ai-credits')
        ->assertOk()
        ->assertJsonPath('data.free_balance', 100)
        ->assertJsonPath('data.paid_balance', 0)
        ->assertJsonPath('data.total_balance', 100)
        ->assertJsonPath('data.pack_catalog.0.code', 'qa-small')
        ->assertJsonPath('data.alert_rules.0.threshold_credits', 50);
});

it('creates ai manual payment request and exposes the admin api review path', function (): void {
    Storage::fake('local');

    $pack = seedAiQaCreditPack();
    seedAiQaManualMethod();

    [$tenant, $user] = createAiQaTenantUser(
        countryCode: 'BD',
        role: UserRole::Admin,
        withActiveSubscription: true,
        plan: TenantPlan::Starter,
    );

    $this->actingAs($user);

    $createResponse = $this->post('/api/v1/billing/ai-mfs-request', [
        'pack_public_id' => $pack->public_id,
        'amount' => 999,
        'sender_number' => '01711111111',
        'transaction_id' => 'AI-QA-TXN-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('ai-proof.png'),
    ], ['Accept' => 'application/json']);

    $createResponse->assertStatus(201)
        ->assertJsonPath('data.tenant_public_id', $tenant->public_id)
        ->assertJsonPath('data.pack.code', $pack->code)
        ->assertJsonPath('data.status', ManualPaymentRequestStatus::Pending->value);

    $publicId = $createResponse->json('data.public_id');

    $this->getJson('/api/v1/billing/ai-mfs-request/status')
        ->assertOk()
        ->assertJsonPath('data.public_id', $publicId)
        ->assertJsonPath('data.status', ManualPaymentRequestStatus::Pending->value);

    $request = AiManualPaymentRequest::query()
        ->withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)
        ->where('public_id', $publicId)
        ->firstOrFail();

    Storage::disk('local')->assertExists($request->screenshot_path);

    $platform = createAiQaPlatformAdmin();
    $this->actingAs($platform);

    $this->getJson('/api/v1/admin/ai-manual-payments?status=pending')
        ->assertOk()
        ->assertJsonPath('data.0.public_id', $publicId);

    $this->get("/api/v1/admin/ai-manual-payments/{$publicId}/screenshot")
        ->assertOk();
});

it('approves ai manual payment requests and credits the tenant wallet', function (): void {
    Storage::fake('local');

    $pack = seedAiQaCreditPack([
        'code' => 'qa-medium',
        'name' => 'QA Medium Pack',
        'credits' => 300,
        'price_bdt' => 2799,
        'sort_order' => 20,
    ]);

    seedAiQaManualMethod();

    [$tenant, $user] = createAiQaTenantUser();

    $this->actingAs($user);

    $createResponse = $this->post('/api/v1/billing/ai-mfs-request', [
        'pack_public_id' => $pack->public_id,
        'amount' => 2799,
        'sender_number' => '01711111111',
        'transaction_id' => 'AI-QA-TXN-APPROVE-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('ai-approve.png'),
    ], ['Accept' => 'application/json']);

    $publicId = $createResponse->json('data.public_id');
    $platform = createAiQaPlatformAdmin();

    $this->actingAs($platform);

    $this->postJson("/api/v1/admin/ai-manual-payments/{$publicId}/approve", [])
        ->assertOk()
        ->assertJsonPath('data.status', ManualPaymentRequestStatus::Approved->value);

    $wallet = AiCreditWallet::query()->where('tenant_id', $tenant->id)->firstOrFail();
    expect($wallet->paid_balance)->toBe(300);

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Purchase->value)
            ->value('credits_delta')
    )->toBe(300);

    $this->actingAs($user);

    $this->getJson('/api/v1/billing/ai-credits')
        ->assertOk()
        ->assertJsonPath('data.paid_balance', 300)
        ->assertJsonPath('data.total_balance', 400);
});

it('rejects ai manual payment requests without granting credits', function (): void {
    Storage::fake('local');

    $pack = seedAiQaCreditPack([
        'code' => 'qa-large',
        'name' => 'QA Large Pack',
        'credits' => 800,
        'price_bdt' => 6499,
        'sort_order' => 30,
    ]);

    seedAiQaManualMethod();

    [$tenant, $user] = createAiQaTenantUser();

    $this->actingAs($user);

    $createResponse = $this->post('/api/v1/billing/ai-mfs-request', [
        'pack_public_id' => $pack->public_id,
        'amount' => 6499,
        'sender_number' => '01711111111',
        'transaction_id' => 'AI-QA-TXN-REJECT-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('ai-reject.png'),
    ], ['Accept' => 'application/json']);

    $publicId = $createResponse->json('data.public_id');
    $platform = createAiQaPlatformAdmin();

    $this->actingAs($platform);

    $this->postJson("/api/v1/admin/ai-manual-payments/{$publicId}/reject", [
        'reason' => 'Proof is unreadable',
    ])->assertOk()
        ->assertJsonPath('data.status', ManualPaymentRequestStatus::Rejected->value)
        ->assertJsonPath('data.rejection_reason', 'Proof is unreadable');

    expect(
        AiCreditLedger::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', AiLedgerEventType::Purchase->value)
            ->count()
    )->toBe(0);

    $this->actingAs($user);

    $this->getJson('/api/v1/billing/ai-credits')
        ->assertOk()
        ->assertJsonPath('data.paid_balance', 0)
        ->assertJsonPath('data.total_balance', 100);
});

it('enforces the platform role for ai manual payment admin endpoints', function (): void {
    Storage::fake('local');

    $pack = seedAiQaCreditPack();
    seedAiQaManualMethod();

    [, $user] = createAiQaTenantUser();

    $this->actingAs($user);

    $createResponse = $this->post('/api/v1/billing/ai-mfs-request', [
        'pack_public_id' => $pack->public_id,
        'amount' => 999,
        'sender_number' => '01711111111',
        'transaction_id' => 'AI-QA-TXN-ROLE-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('ai-role.png'),
    ], ['Accept' => 'application/json']);

    $publicId = $createResponse->json('data.public_id');

    $this->postJson("/api/v1/admin/ai-manual-payments/{$publicId}/approve", [])
        ->assertStatus(403);
});
