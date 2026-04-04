<?php

use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('expires a tenant trial by user email for QA', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Starter,
        'trial_ends_at' => now()->addDays(12),
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    $this->artisan('billing:expire-trial', [
        'target' => $user->email,
    ])
        ->expectsOutputToContain('Trial is expired and no billing access remains.')
        ->assertSuccessful();

    $tenant->refresh();

    expect($tenant->trial_ends_at)->not->toBeNull();
    expect($tenant->trial_ends_at?->isPast())->toBeTrue();
});
