<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
    $this->actingAs(User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Lawyer, 'locale' => 'en']));
});

it('serves a month or a quarter of hearings', function (string $from, string $to): void {
    $this->getJson("/api/v1/hearings/calendar?from={$from}&to={$to}")->assertOk();
})->with([
    'one day' => ['2026-10-03', '2026-10-03'],
    'a month' => ['2026-10-01', '2026-10-31'],
    'a quarter' => ['2026-10-01', '2027-01-01'],
]);

it('refuses ranges longer than a quarter', function (): void {
    $this->getJson('/api/v1/hearings/calendar?from=2000-01-01&to=2100-01-01')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['to' => 'Choose a range of 92 days or less.']);
});

it('still rejects an end date before the start', function (): void {
    $this->getJson('/api/v1/hearings/calendar?from=2026-10-10&to=2026-10-01')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('to');
});
