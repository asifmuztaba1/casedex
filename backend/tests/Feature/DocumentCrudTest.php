<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function createDocTestUser(): User
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

function createDocTestCase(User $user): string
{
    $response = test()->actingAs($user)->postJson('/api/v1/cases', [
        'title' => 'Doc Test Case',
        'court' => 'District Court',
        'story' => 'Test story for documents',
        'petition_draft' => 'Test draft',
        'client' => ['name' => 'Test Client'],
    ]);

    return $response->json('data.public_id');
}

it('uploads a document to a case', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
        'file' => UploadedFile::fake()->create('petition.pdf', 100, 'application/pdf'),
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.category', 'petition');
});

it('lists documents for a case', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'evidence',
        'file' => UploadedFile::fake()->create('evidence.pdf', 50, 'application/pdf'),
    ]);

    $response = $this->getJson("/api/v1/cases/{$casePublicId}/documents");
    $response->assertOk();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

it('lists all documents across cases', function (): void {
    $user = createDocTestUser();
    $this->actingAs($user);

    $response = $this->getJson('/api/v1/documents');
    $response->assertOk();
});

it('deletes a document', function (): void {
    Storage::fake();
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $createResponse = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'order_sheet',
        'file' => UploadedFile::fake()->create('order.pdf', 80, 'application/pdf'),
    ]);
    $createResponse->assertStatus(201);

    $publicId = $createResponse->json('data.public_id');

    $response = $this->deleteJson("/api/v1/documents/{$publicId}");
    $response->assertNoContent();
});

it('rejects upload without file', function (): void {
    $user = createDocTestUser();
    $this->actingAs($user);
    $casePublicId = createDocTestCase($user);

    $response = $this->postJson("/api/v1/cases/{$casePublicId}/documents", [
        'category' => 'petition',
    ]);

    $response->assertUnprocessable();
});
