<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
 * Users type hearing/diary times as local wall-clock time and the backend
 * stores them that way. The API must return them without a timezone suffix,
 * otherwise browsers treat "10:00Z" as UTC and show 16:00 in Bangladesh.
 */

uses(RefreshDatabase::class);

it('returns hearing and diary times exactly as entered, without a timezone', function (): void {
    $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);
    $tenant = Tenant::factory()->create([
        'country_id' => $country->id,
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'country_id' => $country->id, 'role' => UserRole::Admin]);
    $this->actingAs($user);

    $case = $this->postJson('/api/v1/cases', [
        'title' => 'Wall clock case',
        'court' => 'District Court',
        'client' => ['name' => 'Client'],
    ])->assertCreated()->json('data.public_id');

    // Exactly what the browser's datetime-local input sends.
    $hearing = $this->postJson("/api/v1/cases/{$case}/hearings", [
        'hearing_at' => '2026-10-20T10:00',
        'type' => 'mention',
    ])->assertCreated();
    expect($hearing->json('data.hearing_at'))->toBe('2026-10-20T10:00:00');

    $this->getJson("/api/v1/cases/{$case}")
        ->assertOk()
        ->assertJsonPath('data.upcoming_hearings.0.hearing_at', '2026-10-20T10:00:00');

    $diary = $this->postJson("/api/v1/cases/{$case}/diary", [
        'case_public_id' => $case,
        'entry_at' => '2026-10-20T18:45',
        'title' => 'Evening note',
        'body' => 'x',
    ])->assertCreated();
    expect($diary->json('data.entry_at'))->toBe('2026-10-20T18:45:00');
});
