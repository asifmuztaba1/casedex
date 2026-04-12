<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Clients\Models\Client;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createAuthenticatedUser(): User
{
    $country = Country::query()->firstOrCreate(
        ['code' => 'BD'],
        ['name' => 'Bangladesh', 'active' => true]
    );

    $tenant = Tenant::factory()->create([
        'country_id' => $country->id,
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);

    return User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => UserRole::Admin,
    ]);
}

function validCasePayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Test Case v Defendant',
        'court' => 'Supreme Court, Dhaka',
        'case_number' => 'CS-2026-001',
        'status' => CaseStatus::Open->value,
        'story' => 'Client disputes land ownership in Mirpur.',
        'petition_draft' => 'The petitioner humbly prays that...',
        'client' => ['name' => 'Mr. Karim'],
    ], $overrides);
}

it('lists cases for authenticated user', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $response = $this->getJson('/api/v1/cases');
    $response->assertOk();
});

it('creates a case with required fields', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $response = $this->postJson('/api/v1/cases', validCasePayload());

    $response->assertStatus(201)
        ->assertJsonPath('data.title', 'Test Case v Defendant');
});

it('shows a single case by public_id', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $createResponse = $this->postJson('/api/v1/cases', validCasePayload([
        'title' => 'Show Test Case',
    ]));
    $createResponse->assertStatus(201);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->getJson("/api/v1/cases/{$publicId}");
    $response->assertOk()
        ->assertJsonPath('data.title', 'Show Test Case');
});

it('updates a case', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $createResponse = $this->postJson('/api/v1/cases', validCasePayload([
        'title' => 'Original Title',
    ]));
    $createResponse->assertStatus(201);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->putJson("/api/v1/cases/{$publicId}", [
        'title' => 'Updated Title',
        'status' => CaseStatus::Active->value,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.title', 'Updated Title');
});

it('deletes a case', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $createResponse = $this->postJson('/api/v1/cases', validCasePayload([
        'title' => 'To Be Deleted',
    ]));
    $createResponse->assertStatus(201);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->deleteJson("/api/v1/cases/{$publicId}");
    $response->assertNoContent();

    $this->getJson("/api/v1/cases/{$publicId}")->assertNotFound();
});

it('rejects unauthenticated access to cases', function (): void {
    $this->getJson('/api/v1/cases')->assertUnauthorized();
});

it('validates required fields on case creation', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $response = $this->postJson('/api/v1/cases', []);
    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'story', 'petition_draft']);
});

it('creates a rural client with only a name and stores null contact fields', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $response = $this->postJson('/api/v1/cases', validCasePayload([
        'title' => 'Rural Client v Opponent',
        'client' => [
            'name' => 'মোঃ করিম উদ্দিন',
        ],
    ]));

    $response->assertStatus(201);

    TenantContext::set($user->tenant_id);
    try {
        $client = Client::query()
            ->where('name', 'মোঃ করিম উদ্দিন')
            ->firstOrFail();
    } finally {
        TenantContext::clear();
    }

    expect($client->email)->toBeNull();
    expect($client->phone)->toBeNull();
    expect($client->address)->toBeNull();
    expect($client->identity_number)->toBeNull();
});

it('creates a rural client with phone and NID but no email', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $response = $this->postJson('/api/v1/cases', validCasePayload([
        'title' => 'Village Dispute',
        'client' => [
            'name' => 'রহিমা খাতুন',
            'phone' => '+8801712345678',
            'address' => 'গ্রাম: বাঁশবাড়িয়া, উপজেলা: কচুয়া, চাঁদপুর',
            'identity_number' => '1234567890123',
        ],
    ]));

    $response->assertStatus(201);

    TenantContext::set($user->tenant_id);
    try {
        $client = Client::query()
            ->where('name', 'রহিমা খাতুন')
            ->firstOrFail();
    } finally {
        TenantContext::clear();
    }

    expect($client->email)->toBeNull();
    expect($client->phone)->toBe('+8801712345678');
    expect($client->identity_number)->toBe('1234567890123');
    expect($client->address)->toContain('বাঁশবাড়িয়া');
});

it('rejects a malformed email when one is provided', function (): void {
    $user = createAuthenticatedUser();
    $this->actingAs($user);

    $response = $this->postJson('/api/v1/cases', validCasePayload([
        'client' => [
            'name' => 'Bad Email Client',
            'email' => 'not-an-email',
        ],
    ]));

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['client.email']);
});
