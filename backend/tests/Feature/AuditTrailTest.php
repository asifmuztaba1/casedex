<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * AGENTS.md §9 requires audit logs for login, case changes, document
 * upload/delete and hearing updates. These tests drive each one through
 * the real API so a refactor cannot silently drop an entry.
 */
function auditUser(): User
{
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);

    return User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
        'password' => 'Audit#2026pass',
    ]);
}

/**
 * @return array<int, array{action: string, user_id: int|null, target_id: string|null}>
 */
function auditEntries(User $user): array
{
    return AuditLog::query()->withoutGlobalScopes()
        ->where('tenant_id', $user->tenant_id)
        ->orderBy('id')
        ->get(['action', 'user_id', 'target_id'])
        ->map(fn (AuditLog $log): array => [
            'action' => $log->action,
            'user_id' => $log->user_id,
            'target_id' => $log->target_id,
        ])
        ->all();
}

function auditCase(User $user): string
{
    return test()->actingAs($user)->postJson('/api/v1/cases', [
        'title' => 'State v. Audit',
        'court' => 'District Court',
        'story' => 'Audit trail fixture',
        'client' => ['name' => 'Audit Client'],
    ])->assertCreated()->json('data.public_id');
}

it('records login and logout', function (): void {
    $user = auditUser();

    $this->withHeader('Origin', config('app.url'))
        ->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Audit#2026pass'])
        ->assertOk();
    $this->withHeader('Origin', config('app.url'))
        ->postJson('/api/v1/auth/logout')
        ->assertSuccessful();

    $authEntries = collect(auditEntries($user))->where('target_id', $user->public_id)->values()->all();
    expect($authEntries)->toBe([
        ['action' => 'auth.login', 'user_id' => $user->id, 'target_id' => $user->public_id],
        ['action' => 'auth.logout', 'user_id' => $user->id, 'target_id' => $user->public_id],
    ]);
});

it('does not record a login for a wrong password', function (): void {
    $user = auditUser();

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])
        ->assertStatus(422);

    expect(auditEntries($user))->toBe([]);
});

it('records case create, update and delete', function (): void {
    $user = auditUser();
    $caseId = auditCase($user);

    $this->putJson("/api/v1/cases/{$caseId}", ['title' => 'State v. Audit (amended)'])->assertOk();
    $this->deleteJson("/api/v1/cases/{$caseId}")->assertSuccessful();

    $caseEntries = collect(auditEntries($user))->where('target_id', $caseId)->pluck('action')->values()->all();
    expect($caseEntries)->toBe(['case.created', 'case.updated', 'case.deleted']);
});

it('records document upload and delete', function (): void {
    Storage::fake();
    $user = auditUser();
    $caseId = auditCase($user);

    $documentId = $this->postJson("/api/v1/cases/{$caseId}/documents", [
        'category' => 'petition',
        'file' => UploadedFile::fake()->create('petition.pdf', 100, 'application/pdf'),
    ])->assertCreated()->json('data.public_id');
    $this->deleteJson("/api/v1/documents/{$documentId}")->assertSuccessful();

    $documentEntries = collect(auditEntries($user))->where('target_id', $documentId)->pluck('action')->values()->all();
    expect($documentEntries)->toBe(['document.created', 'document.deleted']);
});

it('records hearing create, update and delete', function (): void {
    $user = auditUser();
    $caseId = auditCase($user);

    $hearingId = $this->postJson("/api/v1/cases/{$caseId}/hearings", [
        'hearing_at' => now()->addDays(7)->toDateTimeString(),
        'type' => HearingType::Mention->value,
    ])->assertCreated()->json('data.public_id');
    $this->putJson("/api/v1/hearings/{$hearingId}", ['agenda' => 'Adjourned to next date'])->assertOk();
    $this->deleteJson("/api/v1/hearings/{$hearingId}")->assertSuccessful();

    $hearingEntries = collect(auditEntries($user))->where('target_id', $hearingId)->pluck('action')->values()->all();
    expect($hearingEntries)->toBe(['hearing.created', 'hearing.updated', 'hearing.deleted']);
});

it('keeps each tenant audit trail separate', function (): void {
    $first = auditUser();
    $second = auditUser();
    auditCase($first);
    auditCase($second);

    expect(collect(auditEntries($first))->pluck('user_id')->filter()->unique()->values()->all())->toBe([$first->id]);
    expect(collect(auditEntries($second))->pluck('user_id')->filter()->unique()->values()->all())->toBe([$second->id]);
});
