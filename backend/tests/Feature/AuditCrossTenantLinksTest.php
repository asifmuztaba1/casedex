<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Clients\Models\Client;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * @return array{tenant: Tenant, case: CaseFile, client: Client}
 */
function auditTenant(string $label): array
{
    $tenant = Tenant::factory()->create(['name' => "Tenant {$label}"]);
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Admin]);

    TenantContext::set($tenant->id);
    try {
        $client = Client::create(['tenant_id' => $tenant->id, 'name' => "Client {$label}"]);
        $case = CaseFile::create([
            'tenant_id' => $tenant->id,
            'title' => "Case {$label}",
            'court' => 'District Court',
            'client_id' => $client->id,
            'created_by' => $user->id,
        ]);
    } finally {
        TenantContext::clear();
    }

    return compact('tenant', 'case', 'client');
}

it('passes when every reference stays inside its tenant', function (): void {
    auditTenant('A');
    auditTenant('B');

    $this->artisan('tenancy:audit-cross-tenant-links')
        ->expectsOutputToContain('No cross-tenant references found.')
        ->assertSuccessful();
});

it('reports a case that points at another tenant client', function (): void {
    $a = auditTenant('A');
    $b = auditTenant('B');

    // Simulate the pre-fix bug: tenant B's case linked to tenant A's client.
    DB::table('cases')->where('id', $b['case']->id)->update(['client_id' => $a['client']->id]);

    $this->artisan('tenancy:audit-cross-tenant-links')
        ->expectsOutputToContain('Found 1 cross-tenant reference(s).')
        ->assertFailed();
});
