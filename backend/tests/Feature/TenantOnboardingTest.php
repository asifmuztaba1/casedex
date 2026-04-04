<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a tenant on the selected plan while starting the 30-day trial', function (): void {
    $country = Country::query()->create([
        'name' => 'Bangladesh',
        'code' => 'BD',
        'active' => true,
    ]);

    $user = User::factory()->create([
        'tenant_id' => null,
        'country_id' => $country->id,
        'role' => UserRole::Assistant,
    ]);

    $this->actingAs($user);

    $response = $this->postJson('/api/v1/tenants', [
        'tenant_name' => 'Chosen Plan Chambers',
        'country_id' => $country->id,
        'locale' => 'en',
        'plan' => 'professional',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.tenant_id', fn (mixed $tenantId): bool => is_int($tenantId) && $tenantId > 0);

    $user->refresh();
    $tenant = Tenant::query()->findOrFail($user->tenant_id);

    expect($tenant->plan?->value)->toBe('professional');
    expect($tenant->trial_ends_at)->not->toBeNull();
    expect($tenant->trial_ends_at?->isFuture())->toBeTrue();
    expect($user->role?->value)->toBe(UserRole::Admin->value);
});
