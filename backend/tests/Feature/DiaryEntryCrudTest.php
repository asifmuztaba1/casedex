<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createDiaryTestUser(): User
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

function createDiaryTestCase(User $user): string
{
    $response = test()->actingAs($user)->postJson('/api/v1/cases', [
        'title' => 'Diary Test Case',
        'court' => 'District Court',
        'story' => 'Test story for diary',
        'petition_draft' => 'Test draft',
        'client' => ['name' => 'Test Client'],
    ]);

    return $response->json('data.public_id');
}

it('creates a diary entry for a case', function (): void {
    $user = createDiaryTestUser();
    $this->actingAs($user);
    $casePublicId = createDiaryTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/diary", [
        'entry_at' => now()->toDateTimeString(),
        'title' => 'Client meeting notes',
        'body' => 'Discussed settlement options with the client.',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.title', 'Client meeting notes');
});

it('lists diary entries for a case', function (): void {
    $user = createDiaryTestUser();
    $this->actingAs($user);
    $casePublicId = createDiaryTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/diary", [
        'entry_at' => now()->toDateTimeString(),
        'title' => 'Entry 1',
        'body' => 'Body 1',
    ]);

    $response = $this->getJson("/api/v1/cases/{$casePublicId}/diary");
    $response->assertOk();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

it('lists all diary entries across cases', function (): void {
    $user = createDiaryTestUser();
    $this->actingAs($user);

    $response = $this->getJson('/api/v1/diary-entries');
    $response->assertOk();
});

it('updates a diary entry', function (): void {
    $user = createDiaryTestUser();
    $this->actingAs($user);
    $casePublicId = createDiaryTestCase($user);

    $createResponse = $this->postJson("/api/v1/cases/{$casePublicId}/diary", [
        'entry_at' => now()->toDateTimeString(),
        'title' => 'Original Entry',
        'body' => 'Original body',
    ]);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->putJson("/api/v1/diary-entries/{$publicId}", [
        'title' => 'Updated Entry',
        'body' => 'Updated body with more details',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.title', 'Updated Entry');
});

it('deletes a diary entry', function (): void {
    $user = createDiaryTestUser();
    $this->actingAs($user);
    $casePublicId = createDiaryTestCase($user);

    $createResponse = $this->postJson("/api/v1/cases/{$casePublicId}/diary", [
        'entry_at' => now()->toDateTimeString(),
        'title' => 'To Delete',
        'body' => 'Will be deleted',
    ]);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->deleteJson("/api/v1/diary-entries/{$publicId}");
    $response->assertNoContent();
});

it('validates required diary entry fields', function (): void {
    $user = createDiaryTestUser();
    $this->actingAs($user);
    $casePublicId = createDiaryTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/diary", []);
    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['entry_at', 'title', 'body']);
});
