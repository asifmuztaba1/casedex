<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Mail\WorkspaceExportReadyMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function exportAdmin(UserRole $role = UserRole::Admin, ?Tenant $tenant = null): User
{
    $tenant ??= Tenant::factory()->create([
        'name' => 'Rahim Chambers',
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);

    return User::factory()->create(['tenant_id' => $tenant->id, 'role' => $role, 'locale' => 'en']);
}

/** One case with a client, an opponent, a hearing, a diary entry and two same-named documents. */
function seedExportableCase(User $admin, string $title = 'Salma Begum v. Kamal Hossain'): string
{
    test()->actingAs($admin);
    $case = test()->postJson('/api/v1/cases', [
        'title' => $title,
        'court' => 'District Court, Dhaka',
        'client' => ['name' => 'সালমা বেগম', 'phone' => '01700000000'],
    ])->assertCreated()->json('data.public_id');

    $hearing = test()->postJson("/api/v1/cases/{$case}/hearings", [
        'hearing_at' => '2026-11-04 10:30:00',
        'type' => HearingType::Mention->value,
        'agenda' => 'First mention',
    ])->assertCreated()->json('data.public_id');
    test()->postJson("/api/v1/cases/{$case}/diary", [
        'case_public_id' => $case,
        'hearing_public_id' => $hearing,
        'entry_at' => '2026-10-02 09:00:00',
        'title' => 'Prepared bail petition',
        'body' => 'Collected the medical certificate.',
    ])->assertCreated();
    test()->postJson("/api/v1/cases/{$case}/parties", ['name' => 'Kamal Hossain', 'type' => 'person', 'side' => 'opponent'])->assertCreated();
    foreach (['first', 'second'] as $content) {
        test()->post("/api/v1/cases/{$case}/documents", [
            'category' => 'petition',
            'file' => UploadedFile::fake()->createWithContent('petition.pdf', "%PDF-1.4 {$content}"),
        ], ['Accept' => 'application/json'])->assertCreated();
    }

    return $case;
}

/**
 * @return array<string, string> zip entry name (without the root folder) => contents
 */
function readExportZip(WorkspaceExport $export): array
{
    $local = tempnam(sys_get_temp_dir(), 'zip');
    file_put_contents($local, Storage::disk(config('filesystems.default'))->get($export->path));
    $zip = new ZipArchive;
    $zip->open($local);
    $entries = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        $entries[substr($name, strpos($name, '/') + 1)] = $zip->getFromIndex($i);
    }
    $zip->close();
    unlink($local);

    return $entries;
}

beforeEach(function (): void {
    Storage::fake(config('filesystems.default'));
    Mail::fake();
});

it('builds a complete export and emails the admin a download link', function (): void {
    $admin = exportAdmin();
    $case = seedExportableCase($admin);

    $response = $this->postJson('/api/v1/workspace/exports')->assertStatus(202);
    $export = WorkspaceExport::query()->withoutGlobalScopes()->sole();

    expect($response->json('data.public_id'))->toBe($export->public_id);
    expect($export->status)->toBe(WorkspaceExport::STATUS_READY);
    expect($export->expires_at->isBetween(now()->addDays(6), now()->addDays(8)))->toBeTrue();

    $files = readExportZip($export);
    expect(array_keys($files))->toContain(
        'README.txt', 'data/cases.json', 'data/contacts.json', 'data/team.json', 'data/workspace.json', 'data/research-notes.json',
        'csv/cases.csv', 'csv/hearings.csv', 'csv/diary-entries.csv', 'csv/documents.csv', 'csv/parties.csv', 'csv/contacts.csv',
    );

    $cases = json_decode($files['data/cases.json'], true);
    expect($cases)->toHaveCount(1);
    expect($cases[0])->toMatchArray(['public_id' => $case, 'title' => 'Salma Begum v. Kamal Hossain']);
    expect($cases[0]['client']['name'])->toBe('সালমা বেগম');
    expect(collect($cases[0]['parties'])->pluck('name')->all())->toContain('Kamal Hossain');
    expect($cases[0]['hearings'][0]['agenda'])->toBe('First mention');
    // Wall-clock times keep the time the lawyer entered, with no UTC "Z" that would shift them 6 hours.
    expect($cases[0]['hearings'][0]['hearing_at'])->toBe('2026-11-04T10:30:00');
    expect($cases[0]['diary_entries'][0]['entry_at'])->toBe('2026-10-02T09:00:00');
    expect($files['csv/hearings.csv'])->toContain('2026-11-04T10:30:00')->not->toContain('2026-11-04T10:30:00.000000Z');
    expect($cases[0]['diary_entries'][0]['hearing_public_id'])->toBe($cases[0]['hearings'][0]['public_id']);

    // Both uploads named petition.pdf survive, with their own contents.
    $documentFiles = collect($cases[0]['documents'])->pluck('file_in_export')->all();
    expect($documentFiles)->toHaveCount(2)->each->toStartWith('documents/Salma Begum v. Kamal Hossain/');
    expect($documentFiles[0])->not->toBe($documentFiles[1]);
    expect(collect($documentFiles)->map(fn (string $f): string => $files[$f])->sort()->values()->all())
        ->toBe(['%PDF-1.4 first', '%PDF-1.4 second']);

    // Public ids only: no internal ids or storage paths anywhere.
    expect($files['data/cases.json'])->not->toContain('"id":')->not->toContain('tenant_id')->not->toContain('storage_key');
    expect($files['csv/cases.csv'])->toStartWith("\xEF\xBB\xBF");

    $emailedUrl = null;
    Mail::assertSent(WorkspaceExportReadyMail::class, function (WorkspaceExportReadyMail $mail) use ($admin, &$emailedUrl): bool {
        $emailedUrl = $mail->downloadUrl;

        return $mail->hasTo($admin->email);
    });
    expect($emailedUrl)->toStartWith(rtrim(config('app.url'), '/')."/api/v1/workspace-exports/{$export->public_id}/download?");

    // The signature covers the path only, so the link works whatever host a proxy presents.
    $this->get('http://another-host.test'.parse_url($emailedUrl, PHP_URL_PATH).'?'.parse_url($emailedUrl, PHP_URL_QUERY))->assertOk();
});

it('only exports the requesting workspace', function (): void {
    seedExportableCase(exportAdmin(), 'SECRET-B v. State');
    $admin = exportAdmin();
    seedExportableCase($admin, 'Own case');

    $this->actingAs($admin)->postJson('/api/v1/workspace/exports')->assertStatus(202);

    $export = WorkspaceExport::query()->withoutGlobalScopes()->where('tenant_id', $admin->tenant_id)->sole();
    $everything = implode("\n", readExportZip($export));
    expect($everything)->toContain('Own case')->not->toContain('SECRET-B');
});

it('lets only workspace admins request and list exports', function (): void {
    $lawyer = exportAdmin(UserRole::Lawyer);

    $this->actingAs($lawyer)->postJson('/api/v1/workspace/exports')->assertForbidden();
    $this->getJson('/api/v1/workspace/exports')->assertForbidden();
    expect(WorkspaceExport::query()->withoutGlobalScopes()->count())->toBe(0);
});

it('downloads with the signed link without signing in, and refuses tampered or expired links', function (): void {
    $admin = exportAdmin();
    seedExportableCase($admin);
    $this->postJson('/api/v1/workspace/exports')->assertStatus(202);
    $url = $this->getJson('/api/v1/workspace/exports')->json('data.0.download_url');

    app('auth')->forgetGuards();
    $this->app['auth']->guard('web')->logout();

    $this->get($url)->assertOk()->assertDownload();
    $this->get($url.'x')->assertForbidden();

    $this->travel(8)->days();
    $this->get($url)->assertForbidden();
});

it('reports an export whose file was pruned as gone', function (): void {
    $admin = exportAdmin();
    seedExportableCase($admin);
    $this->postJson('/api/v1/workspace/exports')->assertStatus(202);
    $export = WorkspaceExport::query()->withoutGlobalScopes()->sole();
    $url = $this->getJson('/api/v1/workspace/exports')->json('data.0.download_url');

    $export->forceFill(['expires_at' => now()->subMinute()])->save();
    $this->artisan('workspace:prune-exports')->assertSuccessful();

    expect($export->fresh()->status)->toBe(WorkspaceExport::STATUS_EXPIRED);
    Storage::disk(config('filesystems.default'))->assertMissing($export->path);
    $this->get($url)->assertStatus(410);
});

it('reuses an export that is still being built', function (): void {
    Queue::fake();
    $this->actingAs(exportAdmin());

    $first = $this->postJson('/api/v1/workspace/exports')->assertStatus(202)->json('data.public_id');
    $second = $this->postJson('/api/v1/workspace/exports')->assertStatus(202)->json('data.public_id');

    expect($second)->toBe($first);
    expect(WorkspaceExport::query()->withoutGlobalScopes()->count())->toBe(1);
});

it('limits exports to three an hour per workspace', function (): void {
    Queue::fake();
    $this->actingAs(exportAdmin());

    foreach (range(1, 3) as $attempt) {
        $this->postJson('/api/v1/workspace/exports')->assertStatus(202);
        WorkspaceExport::query()->withoutGlobalScopes()->update(['status' => WorkspaceExport::STATUS_READY]);
    }

    $this->postJson('/api/v1/workspace/exports')->assertStatus(429);
});

it('records requests and downloads in the audit log', function (): void {
    $admin = exportAdmin();
    seedExportableCase($admin);
    $this->postJson('/api/v1/workspace/exports')->assertStatus(202);
    $url = $this->getJson('/api/v1/workspace/exports')->json('data.0.download_url');
    $this->get($url)->assertOk();

    expect(\App\Domain\Auth\Models\AuditLog::query()->withoutGlobalScopes()
        ->where('tenant_id', $admin->tenant_id)
        ->whereIn('action', ['workspace.export_requested', 'workspace.export_downloaded'])
        ->pluck('action')->all())->toBe(['workspace.export_requested', 'workspace.export_downloaded']);
});
