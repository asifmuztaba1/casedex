<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
 * These form requests used `$user->role === 'admin'`, but role is cast to the
 * UserRole enum, so the check was always false and even firm admins got 403
 * (plan change/cancel, renaming the firm, AI credit alert rules).
 */

uses(RefreshDatabase::class);

function adminOnlyUser(UserRole $role): User
{
    $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);
    $tenant = Tenant::factory()->create(['country_id' => $country->id, 'plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);

    return User::factory()->create(['tenant_id' => $tenant->id, 'country_id' => $country->id, 'role' => $role]);
}

dataset('admin_only_requests', [
    'rename firm' => ['putJson', '/api/v1/tenants', ['name' => 'Renamed Chambers']],
    'plan change' => ['postJson', '/api/v1/billing/manual-subscription-change', [
        'type' => 'plan_change', 'requested_plan' => 'chambers', 'requested_interval' => 'monthly', 'effective_at' => now()->addDay()->toDateTimeString(),
    ]],
    'ai alert rule' => ['postJson', '/api/v1/billing/ai-alert-rules', ['threshold' => 20, 'channel_in_app' => true, 'channel_email' => false]],
]);

it('lets firm admins make the request', function (string $method, string $uri, array $payload): void {
    $this->actingAs(adminOnlyUser(UserRole::Admin));

    expect($this->{$method}($uri, $payload)->status())->not->toBe(403);
})->with('admin_only_requests');

it('refuses non-admin members', function (string $method, string $uri, array $payload): void {
    $this->actingAs(adminOnlyUser(UserRole::Lawyer));

    $this->{$method}($uri, $payload)->assertForbidden();
})->with('admin_only_requests');

it('renames the firm for an admin', function (): void {
    $admin = adminOnlyUser(UserRole::Admin);
    $this->actingAs($admin);

    $this->putJson('/api/v1/tenants', ['name' => 'Renamed Chambers'])->assertSuccessful();
    expect($admin->tenant->fresh()->name)->toBe('Renamed Chambers');
});
