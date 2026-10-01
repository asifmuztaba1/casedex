<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
 * Cases link to a court record (court_id) so cause-list alerts can match them.
 * The API must return that link: the `court` text column shadows the court()
 * relation, which made court_public_id always null in responses.
 */

uses(RefreshDatabase::class);

it('links a new case to the selected court and returns the court id', function (): void {
    $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);
    $tenant = Tenant::factory()->create(['country_id' => $country->id, 'plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'country_id' => $country->id, 'role' => UserRole::Admin]);

    $division = CourtDivision::query()->firstOrCreate(['country_id' => $country->id, 'name' => 'Dhaka'], ['name_bn' => 'ঢাকা']);
    $district = CourtDistrict::query()->firstOrCreate(['country_id' => $country->id, 'division_id' => $division->id, 'name' => 'Dhaka'], ['name_bn' => 'ঢাকা']);
    $type = CourtType::query()->firstOrCreate(['country_id' => $country->id, 'name' => 'Joint District Judge Court'], ['name_bn' => 'যুগ্ম জেলা জজ আদালত']);
    $court = Court::query()->create([
        'country_id' => $country->id,
        'division_id' => $division->id,
        'district_id' => $district->id,
        'court_type_id' => $type->id,
        'judiciary_portal_court_id' => 4242,
        'name' => 'Joint District Judge Court 1, Dhaka',
        'name_bn' => 'যুগ্ম জেলা জজ আদালত ১, ঢাকা',
        'is_active' => true,
    ]);

    $this->actingAs($user);

    $caseId = $this->postJson('/api/v1/cases', [
        'title' => 'Court link case',
        'court' => 'Joint District Judge Court 1, Dhaka',
        'court_public_id' => $court->public_id,
        'client' => ['name' => 'Client'],
    ])->assertCreated()->json('data.public_id');

    $this->getJson("/api/v1/cases/{$caseId}")
        ->assertOk()
        ->assertJsonPath('data.court_id', $court->id)
        ->assertJsonPath('data.court_public_id', $court->public_id);

    $list = collect($this->getJson('/api/v1/cases')->json('data'))->firstWhere('public_id', $caseId);
    if (array_key_exists('court_public_id', $list)) {
        expect($list['court_public_id'])->toBe($court->public_id);
    }
});
