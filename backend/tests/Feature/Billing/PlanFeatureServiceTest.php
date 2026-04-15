<?php

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns expected storage limits for paid plans', function (): void {
    $service = app(PlanFeatureService::class);

    expect($service->storageLimitBytes(TenantPlan::Starter))->toBe(2 * 1024 * 1024 * 1024)
        ->and($service->storageLimitBytes(TenantPlan::Professional))->toBe(10 * 1024 * 1024 * 1024)
        ->and($service->storageLimitBytes(TenantPlan::Chambers))->toBe(50 * 1024 * 1024 * 1024);
});

it('returns monthly AI credits per plan', function (): void {
    $service = app(PlanFeatureService::class);

    expect($service->monthlyAiCredits(TenantPlan::Starter))->toBe(100)
        ->and($service->monthlyAiCredits(TenantPlan::Professional))->toBe(300)
        ->and($service->monthlyAiCredits(TenantPlan::Chambers))->toBe(1000);
});

it('exposes seat limits per plan', function (): void {
    $service = app(PlanFeatureService::class);

    expect($service->seatLimit(TenantPlan::Starter))->toBe(1)
        ->and($service->seatLimit(TenantPlan::Professional))->toBe(5)
        ->and($service->seatLimit(TenantPlan::Chambers))->toBeNull();
});

it('gates bulk import, client portal, and sso by plan', function (): void {
    $service = app(PlanFeatureService::class);

    expect($service->hasBulkImport(TenantPlan::Starter))->toBeFalse()
        ->and($service->hasBulkImport(TenantPlan::Professional))->toBeTrue()
        ->and($service->hasBulkImport(TenantPlan::Chambers))->toBeTrue()
        ->and($service->hasClientPortal(TenantPlan::Professional))->toBeFalse()
        ->and($service->hasClientPortal(TenantPlan::Chambers))->toBeTrue()
        ->and($service->hasSso(TenantPlan::Professional))->toBeFalse()
        ->and($service->hasSso(TenantPlan::Chambers))->toBeTrue();
});

it('reports support tier label per plan', function (): void {
    $service = app(PlanFeatureService::class);

    expect($service->supportTier(TenantPlan::Starter))->toBe('community')
        ->and($service->supportTier(TenantPlan::Professional))->toBe('email')
        ->and($service->supportTier(TenantPlan::Chambers))->toBe('email_whatsapp');
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
