<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * AGENTS.md §7: records are addressed by ULID public ids, never by their
 * auto-increment id.
 */
function publicIdUser(): User
{
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);

    return User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Admin]);
}

it('addresses contacts by public id only', function (): void {
    $this->actingAs(publicIdUser());

    $contact = $this->postJson('/api/v1/clients', ['name' => 'Salma Begum'])->assertCreated()->json('data');
    $internalId = DB::table('clients')->where('public_id', $contact['public_id'])->value('id');

    expect(Str::isUlid($contact['public_id']))->toBeTrue();
    expect($contact)->not->toHaveKey('id');
    $this->getJson("/api/v1/clients/{$contact['public_id']}")->assertOk()->assertJsonPath('data.name', 'Salma Begum');
    $this->putJson("/api/v1/clients/{$contact['public_id']}", ['name' => 'Salma Akter'])->assertOk();
    $this->getJson("/api/v1/clients/{$internalId}")->assertNotFound();
    $this->deleteJson("/api/v1/clients/{$contact['public_id']}")->assertNoContent();
});

it('links cases and parties to contacts by public id', function (): void {
    $this->actingAs(publicIdUser());
    $contact = $this->postJson('/api/v1/clients', ['name' => 'Salma Begum'])->assertCreated()->json('data');

    $case = $this->postJson('/api/v1/cases', [
        'title' => 'Salma Begum v. Kamal Hossain',
        'court' => 'District Court',
        'client_public_id' => $contact['public_id'],
    ])->assertCreated()->json('data');
    $this->getJson("/api/v1/cases/{$case['public_id']}")->assertJsonPath('data.client.public_id', $contact['public_id']);

    $party = $this->postJson("/api/v1/cases/{$case['public_id']}/parties", [
        'name' => 'Salma Begum',
        'type' => 'person',
        'side' => 'client',
        'client_public_id' => $contact['public_id'],
    ])->assertCreated()->json('data');

    expect(Str::isUlid($party['public_id']))->toBeTrue();
    expect($party)->not->toHaveKeys(['id', 'case_id', 'client_id']);
    expect($party['client_public_id'])->toBe($contact['public_id']);

    $parties = $this->getJson("/api/v1/cases/{$case['public_id']}")->json('data.parties');
    expect(collect($parties)->firstWhere('public_id', $party['public_id'])['client_public_id'])->toBe($contact['public_id']);

    $this->putJson("/api/v1/cases/{$case['public_id']}/parties/{$party['public_id']}", [
        'name' => 'Salma Begum (petitioner)',
        'type' => 'person',
        'side' => 'client',
    ])->assertOk()->assertJsonPath('data.name', 'Salma Begum (petitioner)');
    $this->deleteJson("/api/v1/cases/{$case['public_id']}/parties/{$party['public_id']}")->assertNoContent();
});

it('rejects a contact public id that does not exist', function (): void {
    $this->actingAs(publicIdUser());

    $this->postJson('/api/v1/cases', [
        'title' => 'Orphan case',
        'court' => 'District Court',
        'client_public_id' => (string) Str::ulid(),
    ])->assertUnprocessable()->assertJsonValidationErrors('client_public_id');
});

it('addresses case participants by public id', function (): void {
    $owner = publicIdUser();
    $associate = User::factory()->create(['tenant_id' => $owner->tenant_id, 'role' => UserRole::Associate]);
    $this->actingAs($owner);
    $case = $this->postJson('/api/v1/cases', [
        'title' => 'State v. Rahman',
        'court' => 'District Court',
        'client' => ['name' => 'Karim Rahman'],
    ])->assertCreated()->json('data.public_id');

    $participant = $this->postJson("/api/v1/cases/{$case}/participants", [
        'user_public_id' => $associate->public_id,
        'role' => 'associate',
    ])->assertCreated()->json('data');

    expect(Str::isUlid($participant['public_id']))->toBeTrue();
    expect($participant)->not->toHaveKey('id');
    $this->deleteJson("/api/v1/cases/{$case}/participants/{$participant['public_id']}")->assertNoContent();
});
