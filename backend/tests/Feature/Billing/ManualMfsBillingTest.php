<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function createTenantUserForCountry(string $countryCode): array
{
    $country = Country::query()->firstOrCreate(
        ['code' => $countryCode],
        [
            'name' => $countryCode,
            'active' => true,
        ]
    );

    $tenant = Tenant::factory()->create([
        'country_id' => $country->id,
        'plan' => TenantPlan::Trial,
        'trial_ends_at' => now()->subDay(),
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => UserRole::Admin,
    ]);

    return [$tenant, $user];
}

it('allows bangladesh tenant manual request and blocks non-bd tenant', function (): void {
    Storage::fake('local');

    [$bdTenant, $bdUser] = createTenantUserForCountry('BD');
    $this->actingAs($bdUser);

    $response = $this->post('/api/v1/billing/manual-request', [
        'plan' => TenantPlan::Starter->value,
        'interval' => 'monthly',
        'amount' => 1900,
        'sender_number' => '01711111111',
        'transaction_id' => 'BD-TXN-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('proof.png'),
    ], ['Accept' => 'application/json']);

    $response->assertStatus(201)
        ->assertJsonPath('data.status', ManualPaymentRequestStatus::Pending->value)
        ->assertJsonPath('data.tenant_public_id', $bdTenant->public_id);

    [$usTenant, $usUser] = createTenantUserForCountry('US');
    $this->actingAs($usUser);

    $blockedResponse = $this->post('/api/v1/billing/manual-request', [
        'plan' => TenantPlan::Starter->value,
        'interval' => 'monthly',
        'amount' => 1900,
        'sender_number' => '01711111111',
        'transaction_id' => 'US-TXN-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('proof.png'),
    ], ['Accept' => 'application/json']);

    $blockedResponse->assertStatus(422);
});

it('rejects duplicate transaction id and amount mismatch', function (): void {
    Storage::fake('local');

    [$tenant, $user] = createTenantUserForCountry('BD');
    $this->actingAs($user);

    $amountMismatch = $this->post('/api/v1/billing/manual-request', [
        'plan' => TenantPlan::Starter->value,
        'interval' => 'monthly',
        'amount' => 1800,
        'sender_number' => '01711111111',
        'transaction_id' => 'TXN-AMOUNT-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('proof.png'),
    ], ['Accept' => 'application/json']);

    $amountMismatch->assertStatus(422);

    $first = $this->post('/api/v1/billing/manual-request', [
        'plan' => TenantPlan::Starter->value,
        'interval' => 'monthly',
        'amount' => 1900,
        'sender_number' => '01711111111',
        'transaction_id' => 'DUP-TXN-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('proof-1.png'),
    ], ['Accept' => 'application/json']);

    $first->assertStatus(201);

    [$otherTenant, $otherUser] = createTenantUserForCountry('BD');
    $this->actingAs($otherUser);

    $duplicate = $this->post('/api/v1/billing/manual-request', [
        'plan' => TenantPlan::Starter->value,
        'interval' => 'monthly',
        'amount' => 1900,
        'sender_number' => '01811111111',
        'transaction_id' => 'DUP-TXN-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('proof-2.png'),
    ], ['Accept' => 'application/json']);

    $duplicate->assertStatus(422);
});

it('grants pending access within 24h and expires after window', function (): void {
    [$tenant, $user] = createTenantUserForCountry('BD');

    ManualPaymentRequest::query()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'plan' => TenantPlan::Starter,
        'interval' => 'monthly',
        'amount' => 1900,
        'currency' => 'BDT',
        'sender_number' => '01711111111',
        'transaction_id' => 'PENDING-TXN-1',
        'sent_at' => now()->subHours(2),
        'screenshot_disk' => 'local',
        'screenshot_path' => 'proofs/pending.png',
        'status' => ManualPaymentRequestStatus::Pending,
        'temporary_access_expires_at' => now()->addHours(2),
    ]);

    $this->actingAs($user);
    $allowed = $this->getJson('/api/v1/cases');
    $allowed->assertOk();

    ManualPaymentRequest::query()
        ->where('tenant_id', $tenant->id)
        ->update([
            'temporary_access_expires_at' => now()->subMinute(),
            'status' => ManualPaymentRequestStatus::Pending,
        ]);

    $blocked = $this->getJson('/api/v1/cases');
    $blocked->assertStatus(403)
        ->assertJsonPath('error', 'subscription_required');

    $this->assertDatabaseHas('manual_payment_requests', [
        'tenant_id' => $tenant->id,
        'status' => ManualPaymentRequestStatus::Expired->value,
    ]);
});

it('admin approve grants active access from sent_at and reject blocks with resubmission allowed', function (): void {
    Storage::fake('local');

    [$tenant, $user] = createTenantUserForCountry('BD');
    $platform = User::factory()->create([
        'tenant_id' => null,
        'role' => UserRole::PlatformAdmin,
    ]);

    $request = ManualPaymentRequest::query()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'plan' => TenantPlan::Professional,
        'interval' => 'yearly',
        'amount' => 49000,
        'currency' => 'BDT',
        'sender_number' => '01711111111',
        'transaction_id' => 'APPROVE-TXN-1',
        'sent_at' => now()->subHours(3),
        'screenshot_disk' => 'local',
        'screenshot_path' => 'proofs/approve.png',
        'status' => ManualPaymentRequestStatus::Pending,
        'temporary_access_expires_at' => now()->addHours(21),
    ]);

    $this->actingAs($platform);
    $approve = $this->postJson("/api/v1/admin/manual-payments/{$request->public_id}/approve", []);
    $approve->assertOk()->assertJsonPath('data.status', ManualPaymentRequestStatus::Approved->value);

    $this->assertDatabaseHas('lemon_squeezy_subscriptions', [
        'billable_type' => \App\Domain\Tenancy\Models\Tenant::class,
        'billable_id' => $tenant->id,
        'type' => 'manual_mfs',
        'lemon_squeezy_id' => 'manual_mfs_'.$request->public_id,
        'status' => 'active',
    ]);

    $approved = $request->fresh();
    expect($approved->approved_starts_at?->timestamp)->toBe($approved->sent_at?->timestamp);

    $this->actingAs($user);
    $allowed = $this->getJson('/api/v1/cases');
    $allowed->assertOk();

    $secondRequest = ManualPaymentRequest::query()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'plan' => TenantPlan::Starter,
        'interval' => 'monthly',
        'amount' => 1900,
        'currency' => 'BDT',
        'sender_number' => '01711111111',
        'transaction_id' => 'REJECT-TXN-1',
        'sent_at' => now(),
        'screenshot_disk' => 'local',
        'screenshot_path' => 'proofs/reject.png',
        'status' => ManualPaymentRequestStatus::Pending,
        'temporary_access_expires_at' => now()->addHours(24),
    ]);

    $this->actingAs($platform);
    $reject = $this->postJson("/api/v1/admin/manual-payments/{$secondRequest->public_id}/reject", [
        'reason' => 'Invalid screenshot',
    ]);
    $reject->assertOk()->assertJsonPath('data.status', ManualPaymentRequestStatus::Rejected->value);

    ManualPaymentRequest::query()->where('id', $approved->id)->update([
        'approved_ends_at' => now()->subMinute(),
    ]);

    $this->actingAs($user);
    $blocked = $this->getJson('/api/v1/cases');
    $blocked->assertStatus(403);

    $resubmit = $this->post('/api/v1/billing/manual-request', [
        'plan' => TenantPlan::Starter->value,
        'interval' => 'monthly',
        'amount' => 1900,
        'sender_number' => '01711111111',
        'transaction_id' => 'RESUBMIT-TXN-1',
        'sent_at' => now()->toISOString(),
        'screenshot' => UploadedFile::fake()->image('proof-resubmit.png'),
    ], ['Accept' => 'application/json']);

    $resubmit->assertStatus(201)
        ->assertJsonPath('data.status', ManualPaymentRequestStatus::Pending->value);
});

it('enforces platform role for admin endpoints', function (): void {
    [$tenant, $user] = createTenantUserForCountry('BD');

    $request = ManualPaymentRequest::query()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'plan' => TenantPlan::Starter,
        'interval' => 'monthly',
        'amount' => 1900,
        'currency' => 'BDT',
        'sender_number' => '01711111111',
        'transaction_id' => 'ROLE-TXN-1',
        'sent_at' => now(),
        'screenshot_disk' => 'local',
        'screenshot_path' => 'proofs/role.png',
        'status' => ManualPaymentRequestStatus::Pending,
        'temporary_access_expires_at' => now()->addHours(24),
    ]);

    $this->actingAs($user);

    $response = $this->postJson("/api/v1/admin/manual-payments/{$request->public_id}/approve", []);
    $response->assertStatus(403);
});
