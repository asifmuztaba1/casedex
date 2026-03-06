<?php

use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('blocks tenant routes when trial expired and no subscription', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Trial,
        'trial_ends_at' => now()->subDay(),
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/cases');

    $response->assertStatus(403)
        ->assertJsonPath('error', 'subscription_required');
});

it('allows tenant routes when subscription is active', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Starter,
        'trial_ends_at' => now()->subDay(),
    ]);

    $tenant->subscriptions()->create([
        'type' => 'default',
        'lemon_squeezy_id' => 'sub_123',
        'status' => 'active',
        'product_id' => 'prod_1',
        'variant_id' => 'var_1',
        'trial_ends_at' => null,
        'renews_at' => now()->addMonth(),
        'ends_at' => null,
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/cases');

    $response->assertOk();
});

it('allows billing routes even when trial expired', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Trial,
        'trial_ends_at' => now()->subDay(),
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/billing/subscription');

    $response->assertOk();
});
