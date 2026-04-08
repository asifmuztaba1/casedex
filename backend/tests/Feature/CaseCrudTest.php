<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
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
