<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('exports tenant audit history as csv for admins on eligible plans', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(20),
    ]);

    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
        'name' => 'Nusrat Admin',
        'email' => 'audit-admin@example.com',
    ]);

    AuditLog::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'user_id' => $admin->id,
        'action' => 'case.created',
        'target_type' => \App\Domain\Cases\Models\CaseFile::class,
        'target_id' => 'case_public_123',
        'metadata' => ['source' => 'qa', 'language' => 'bn'],
        'created_at' => now()->subDay(),
    ]);

    $this->actingAs($admin);

    $response = $this->get('/api/v1/billing/audit-export?days=30');

    $response->assertOk();
    expect((string) $response->headers->get('content-type'))->toContain('text/csv');
    expect((string) $response->headers->get('content-disposition'))->toContain('casedex-audit-export');

    $content = $response->streamedContent();

    expect($content)->toContain('created_at,actor_public_id,actor_name,actor_email,action,target_type,target_id,metadata');
    expect($content)->toContain('case.created');
    expect($content)->toContain('Nusrat Admin');
    expect($content)->toContain('case_public_123');
    expect($content)->toContain('source');
});

it('blocks audit export for plans without the feature', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Starter,
        'trial_ends_at' => now()->addDays(20),
    ]);

    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin);

    $response = $this->getJson('/api/v1/billing/audit-export');

    $response->assertStatus(403);
});

it('blocks audit export for non-admin users', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Chambers,
        'trial_ends_at' => now()->addDays(20),
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Lawyer,
    ]);

    $this->actingAs($user);

    $response = $this->getJson('/api/v1/billing/audit-export');

    $response->assertStatus(403);
});

it('blocks audit export when workspace access has expired', function (): void {
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->subDay(),
    ]);

    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin);

    $response = $this->getJson('/api/v1/billing/audit-export');

    $response->assertStatus(403);
});
