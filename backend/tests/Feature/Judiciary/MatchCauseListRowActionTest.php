<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Judiciary\Actions\MatchCauseListRowAction;
use App\Domain\Judiciary\Dto\CauseListRow;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

function setupMatcherTenant(): array
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

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => UserRole::Admin,
    ]);

    $division = CourtDivision::query()->firstOrCreate(
        ['country_id' => $country->id, 'name' => 'Test Division'],
        ['name_bn' => 'টেস্ট বিভাগ']
    );
    $district = CourtDistrict::query()->firstOrCreate(
        ['country_id' => $country->id, 'division_id' => $division->id, 'name' => 'Test District'],
        ['name_bn' => 'টেস্ট জেলা']
    );
    $courtType = CourtType::query()->firstOrCreate(
        ['country_id' => $country->id, 'name' => 'Test Court Type'],
        ['name_bn' => 'টেস্ট আদালতের ধরণ']
    );

    $court = Court::query()->create([
        'country_id' => $country->id,
        'division_id' => $district->division_id,
        'district_id' => $district->id,
        'court_type_id' => $courtType->id,
        'judiciary_portal_court_id' => random_int(1000, PHP_INT_MAX),
        'name' => 'Matcher Test Court '.uniqid(),
        'name_bn' => 'টেস্ট আদালত',
        'is_active' => true,
    ]);

    return [$tenant, $user, $court];
}

it('matches a case by (court_id, registry_case_type_bn, serial, year) within tenant scope', function () {
    [$tenant, $user, $court] = setupMatcherTenant();

    TenantContext::set($tenant->id);

    CaseFile::query()->create([
        'tenant_id' => $tenant->id,
        'title' => 'Target Case',
        'court' => $court->name,
        'court_id' => $court->id,
        'registry_case_type_bn' => 'দেওয়ানী আপীল',
        'registry_case_serial' => 66,
        'registry_case_year' => 2023,
        'created_by' => $user->id,
    ]);

    CaseFile::query()->create([
        'tenant_id' => $tenant->id,
        'title' => 'Different Year Case',
        'court' => $court->name,
        'court_id' => $court->id,
        'registry_case_type_bn' => 'দেওয়ানী আপীল',
        'registry_case_serial' => 66,
        'registry_case_year' => 2024,
        'created_by' => $user->id,
    ]);

    $row = new CauseListRow(
        serial: 1,
        caseTypeBn: 'দেওয়ানী আপীল',
        caseSerial: 66,
        caseYear: 2023,
        activity: null,
        nextDate: Carbon::parse('2026-07-01'),
        briefOrder: null,
    );

    $matches = (new MatchCauseListRowAction)->handle($row, $court->id);

    expect($matches)->toHaveCount(1);
    expect($matches->first()->title)->toBe('Target Case');

    TenantContext::clear();
});

it('does not match cases from other tenants', function () {
    [$tenant, $user, $court] = setupMatcherTenant();
    [$otherTenant, $otherUser] = setupMatcherTenant();

    TenantContext::set($otherTenant->id);
    CaseFile::query()->create([
        'tenant_id' => $otherTenant->id,
        'title' => 'Other Tenant Case',
        'court' => $court->name,
        'court_id' => $court->id,
        'registry_case_type_bn' => 'দেওয়ানী আপীল',
        'registry_case_serial' => 42,
        'registry_case_year' => 2025,
        'created_by' => $otherUser->id,
    ]);
    TenantContext::clear();

    TenantContext::set($tenant->id);

    $row = new CauseListRow(
        serial: 1,
        caseTypeBn: 'দেওয়ানী আপীল',
        caseSerial: 42,
        caseYear: 2025,
        activity: null,
        nextDate: null,
        briefOrder: null,
    );

    $matches = (new MatchCauseListRowAction)->handle($row, $court->id);

    expect($matches)->toHaveCount(0);

    TenantContext::clear();
});
