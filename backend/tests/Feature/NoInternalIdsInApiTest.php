<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * AGENTS.md §7: tenant records are identified by public ids. Auto-increment
 * ids must not leak through responses. Shared reference data (countries,
 * courts), payment references and Lemon Squeezy catalog ids are allowed.
 */
const REFERENCE_ID_KEYS = [
    'country_id', 'court_id', 'division_id', 'district_id', 'court_type_id',
    'transaction_id', 'variant_id', 'product_id',
];

/**
 * @return array<int, string> dotted paths of keys that look like internal ids
 */
function internalIdPaths(mixed $value, string $path = ''): array
{
    if (! is_array($value)) {
        return [];
    }

    $found = [];
    foreach ($value as $key => $child) {
        $childPath = $path === '' ? (string) $key : "{$path}.{$key}";
        $isIdKey = is_string($key) && ($key === 'id' || str_ends_with($key, '_id'));
        $isAllowed = is_string($key) && (str_ends_with($key, 'public_id') || in_array($key, REFERENCE_ID_KEYS, true));
        // Countries are shared reference data: {id, code, name}.
        $isCountry = $key === 'id' && is_array($value) && array_key_exists('code', $value);

        if ($isIdKey && ! $isAllowed && ! $isCountry) {
            $found[] = $childPath;
        }
        $found = [...$found, ...internalIdPaths($child, $childPath)];
    }

    return $found;
}

it('exposes no internal ids in tenant API responses', function (): void {
    Storage::fake();
    $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
    $admin = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Admin]);
    $associate = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Associate]);
    $this->actingAs($admin);

    $case = $this->postJson('/api/v1/cases', [
        'title' => 'State v. Rahman',
        'court' => 'District Court',
        'client' => ['name' => 'Karim Rahman'],
    ])->assertCreated()->json('data.public_id');
    $hearing = $this->postJson("/api/v1/cases/{$case}/hearings", [
        'hearing_at' => now()->addDays(2)->toDateTimeString(),
        'type' => HearingType::Mention->value,
    ])->assertCreated()->json('data.public_id');
    $this->postJson("/api/v1/cases/{$case}/diary", [
        'case_public_id' => $case,
        'hearing_public_id' => $hearing,
        'entry_at' => now()->toDateTimeString(),
        'title' => 'Prepared mention',
        'body' => 'Notes',
    ])->assertCreated();
    $this->post("/api/v1/cases/{$case}/documents", [
        'category' => 'petition',
        'hearing_public_id' => $hearing,
        'file' => UploadedFile::fake()->create('petition.pdf', 10, 'application/pdf'),
    ], ['Accept' => 'application/json'])->assertCreated();
    $this->postJson("/api/v1/cases/{$case}/parties", ['name' => 'Kamal Hossain', 'type' => 'person', 'side' => 'opponent'])->assertCreated();
    $this->postJson("/api/v1/cases/{$case}/participants", ['user_public_id' => $associate->public_id, 'role' => 'associate'])->assertCreated();
    $this->artisan('hearings:send-reminders')->assertSuccessful();

    $endpoints = [
        '/api/v1/auth/me',
        '/api/v1/users',
        '/api/v1/cases',
        "/api/v1/cases/{$case}",
        "/api/v1/cases/{$case}/hearings",
        "/api/v1/cases/{$case}/diary",
        "/api/v1/cases/{$case}/documents",
        "/api/v1/cases/{$case}/parties",
        "/api/v1/cases/{$case}/participants",
        '/api/v1/hearings',
        '/api/v1/diary-entries',
        '/api/v1/documents',
        '/api/v1/clients',
        '/api/v1/notifications',
        '/api/v1/billing/subscription',
        '/api/v1/billing/invoices',
        '/api/v1/billing/plan-limits',
        '/api/v1/billing/manual-request/status',
        '/api/v1/billing/manual-subscription-change/status',
        '/api/v1/billing/ai-credits',
        '/api/v1/billing/ai-ledger',
        '/api/v1/billing/ai-mfs-request/status',
        '/api/v1/billing/ai-alert-rules',
    ];

    $leaks = [];
    foreach ($endpoints as $endpoint) {
        $response = $this->getJson($endpoint)->assertOk();
        foreach (internalIdPaths($response->json()) as $path) {
            $leaks[] = "{$endpoint} → {$path}";
        }
    }

    expect($leaks)->toBe([]);

    // Storage paths embed the internal tenant id.
    $documents = $this->getJson("/api/v1/cases/{$case}/documents")->json('data');
    expect($documents[0])->not->toHaveKey('storage_key');
});
