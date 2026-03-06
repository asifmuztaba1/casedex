<?php

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns expected storage limits for paid plans', function (): void {
    $service = app(PlanFeatureService::class);

    expect($service->storageLimitBytes(TenantPlan::Starter))->toBe(1024 * 1024 * 1024)
        ->and($service->storageLimitBytes(TenantPlan::Professional))->toBe(5 * 1024 * 1024 * 1024)
        ->and($service->storageLimitBytes(TenantPlan::Chambers))->toBe(10 * 1024 * 1024 * 1024);
});

it('detects expired trial correctly', function (): void {
    $service = app(PlanFeatureService::class);

    $activeTrialTenant = Tenant::factory()->create([
        'plan' => TenantPlan::Trial,
        'trial_ends_at' => now()->addDay(),
    ]);

    $expiredTrialTenant = Tenant::factory()->create([
        'plan' => TenantPlan::Trial,
        'trial_ends_at' => now()->subDay(),
    ]);

    expect($service->isTrialExpired($activeTrialTenant))->toBeFalse()
        ->and($service->isTrialExpired($expiredTrialTenant))->toBeTrue();
});
