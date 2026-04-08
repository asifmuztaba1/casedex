<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createHearingTestUser(): User
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

function createTestCase(User $user): string
{
    $response = test()->actingAs($user)->postJson('/api/v1/cases', [
        'title' => 'Hearing Test Case',
        'court' => 'District Court',
        'story' => 'Test story for hearings',
        'petition_draft' => 'Test draft',
        'client' => ['name' => 'Test Client'],
    ]);

    return $response->json('data.public_id');
}

it('creates a hearing for a case', function (): void {
    $user = createHearingTestUser();
    $this->actingAs($user);
    $casePublicId = createTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/hearings", [
        'hearing_at' => now()->addDays(7)->toDateTimeString(),
        'type' => HearingType::Mention->value,
        'agenda' => 'First mention before court',
        'location' => 'Court Room 5',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.type', 'mention');
});

it('lists hearings for a case', function (): void {
    $user = createHearingTestUser();
    $this->actingAs($user);
    $casePublicId = createTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/hearings", [
        'hearing_at' => now()->addDays(3)->toDateTimeString(),
        'type' => HearingType::Trial->value,
    ]);

    $response = $this->getJson("/api/v1/cases/{$casePublicId}/hearings");
    $response->assertOk();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

it('lists all hearings across cases', function (): void {
    $user = createHearingTestUser();
    $this->actingAs($user);

    $response = $this->getJson('/api/v1/hearings');
    $response->assertOk();
});

it('updates a hearing', function (): void {
    $user = createHearingTestUser();
    $this->actingAs($user);
    $casePublicId = createTestCase($user);

    $createResponse = $this->postJson("/api/v1/cases/{$casePublicId}/hearings", [
        'hearing_at' => now()->addDays(5)->toDateTimeString(),
        'type' => HearingType::Mention->value,
    ]);

    $hearingPublicId = $createResponse->json('data.public_id');

    $response = $this->putJson("/api/v1/hearings/{$hearingPublicId}", [
        'outcome' => 'Adjourned to next week',
        'next_steps' => 'File supplementary affidavit',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.outcome', 'Adjourned to next week');
});

it('deletes a hearing', function (): void {
    $user = createHearingTestUser();
    $this->actingAs($user);
    $casePublicId = createTestCase($user);

    $createResponse = $this->postJson("/api/v1/cases/{$casePublicId}/hearings", [
        'hearing_at' => now()->addDays(10)->toDateTimeString(),
        'type' => HearingType::Order->value,
    ]);

    $hearingPublicId = $createResponse->json('data.public_id');

    $response = $this->deleteJson("/api/v1/hearings/{$hearingPublicId}");
    $response->assertNoContent();
});
