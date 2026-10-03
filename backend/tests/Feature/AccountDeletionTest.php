<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Auth\Models\DeviceToken;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Tenancy\Actions\PurgeWorkspaceAction;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Mail\AccountDeletionCancelledMail;
use App\Mail\AccountDeletionScheduledMail;
use App\Mail\HearingReminderMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake(config('filesystems.default'));
    Mail::fake();
});

function firm(): Tenant
{
    return Tenant::factory()->create(['name' => 'Rahim Chambers', 'plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(60)]);
}

function member(Tenant $tenant, UserRole $role, string $name = 'Member'): User
{
    return User::factory()->create(['tenant_id' => $tenant->id, 'role' => $role, 'name' => $name, 'password' => 'Delete#2026pass', 'locale' => 'en']);
}

/** Start the next request like a new browser visit: no remembered user, web guard. */
function freshVisit(): void
{
    app('auth')->forgetGuards();
    app('auth')->shouldUse('web');
}

function requestDeletion(User $user, string $password = 'Delete#2026pass'): Illuminate\Testing\TestResponse
{
    app('auth')->forgetGuards();

    return test()->actingAs($user)->postJson('/api/v1/account/deletion', ['password' => $password]);
}

/** A case with a hearing tomorrow, a diary entry, an uploaded document, a contact and a support ticket. */
function seedFirmData(User $author): string
{
    test()->actingAs($author);
    $case = test()->postJson('/api/v1/cases', [
        'title' => 'Salma Begum v. Kamal Hossain',
        'court' => 'District Court',
        'client' => ['name' => 'Salma Begum'],
    ])->assertCreated()->json('data.public_id');
    $hearing = test()->postJson("/api/v1/cases/{$case}/hearings", [
        'hearing_at' => now()->addDay()->setTime(10, 0)->toDateTimeString(),
        'type' => HearingType::Mention->value,
    ])->assertCreated()->json('data.public_id');
    test()->postJson("/api/v1/cases/{$case}/diary", [
        'case_public_id' => $case, 'hearing_public_id' => $hearing,
        'entry_at' => now()->toDateTimeString(), 'title' => 'Prep', 'body' => 'Notes',
    ])->assertCreated();
    test()->post("/api/v1/cases/{$case}/documents", [
        'category' => 'petition',
        'file' => UploadedFile::fake()->createWithContent('petition.pdf', '%PDF-1.4 secret'),
    ], ['Accept' => 'application/json'])->assertCreated();
    test()->postJson('/api/v1/research-notes', ['title' => 'Bail precedents', 'body' => 'Notes'])->assertCreated();
    test()->postJson('/api/v1/support/tickets', ['subject' => 'Help', 'body' => 'Question about a case'])->assertSuccessful();

    return $case;
}

describe('before deleting', function (): void {
    it('explains what deletion would do', function (): void {
        $tenant = firm();
        $admin = member($tenant, UserRole::Admin, 'Admin');
        $lawyer = member($tenant, UserRole::Lawyer, 'Lawyer');

        $this->actingAs($admin)->getJson('/api/v1/account/deletion')->assertOk()
            ->assertJsonPath('data', ['can_delete' => false, 'blocked_reason' => 'handover_required', 'workspace_will_be_deleted' => false, 'grace_days' => 30]);

        app('auth')->forgetGuards();
        $this->actingAs($lawyer)->getJson('/api/v1/account/deletion')->assertJsonPath('data.can_delete', true)
            ->assertJsonPath('data.workspace_will_be_deleted', false);

        $solo = member(firm(), UserRole::Admin);
        app('auth')->forgetGuards();
        $this->actingAs($solo)->getJson('/api/v1/account/deletion')->assertJsonPath('data.can_delete', true)
            ->assertJsonPath('data.workspace_will_be_deleted', true);
    });

    it('requires the password', function (): void {
        $user = member(firm(), UserRole::Lawyer);

        requestDeletion($user, 'wrong')->assertUnprocessable()->assertJsonValidationErrors('password');

        expect($user->fresh()->deletion_requested_at)->toBeNull();
    });

    it('makes the only admin hand over first', function (): void {
        $tenant = firm();
        $admin = member($tenant, UserRole::Admin);
        member($tenant, UserRole::Lawyer);

        requestDeletion($admin)->assertStatus(409)->assertJsonPath('error', 'handover_required');
        expect($admin->fresh()->deletion_requested_at)->toBeNull();

        member($tenant, UserRole::Admin, 'Second admin');
        requestDeletion($admin)->assertStatus(202);
    });
});

describe('requesting deletion', function (): void {
    it('schedules erasure in 30 days and signs out every device', function (): void {
        $tenant = firm();
        member($tenant, UserRole::Admin);
        $user = member($tenant, UserRole::Lawyer);
        $phone = $user->createToken('Pixel', ['mobile'])->plainTextToken;
        PushSubscription::query()->withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id, 'user_id' => $user->id, 'endpoint' => 'https://push.test/1',
            'endpoint_hash' => hash('sha256', 'https://push.test/1'), 'p256dh_key' => 'k', 'auth_key' => 'a',
        ]);

        $response = requestDeletion($user)->assertStatus(202);

        $user->refresh();
        expect($user->isDeletionPending())->toBeTrue();
        expect($user->deletion_scheduled_for->isSameDay(now()->addDays(30)))->toBeTrue();
        expect($response->json('data'))->toMatchArray(['workspace_will_be_deleted' => false]);
        expect(DeviceToken::query()->count())->toBe(0);
        expect(PushSubscription::query()->withoutGlobalScopes()->count())->toBe(0);
        app('auth')->forgetGuards();
        $this->withToken($phone)->getJson('/api/v1/auth/me')->assertUnauthorized();
        Mail::assertQueued(AccountDeletionScheduledMail::class, fn ($mail): bool => $mail->hasTo($user->email) && ! $mail->workspaceWillBeDeleted);
        expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'account.deletion_requested')->count())->toBe(1);
    });

    it('emails the last member an export that lasts until the deletion date', function (): void {
        $solo = member(firm(), UserRole::Admin);
        seedFirmData($solo);

        requestDeletion($solo)->assertStatus(202)->assertJsonPath('data.workspace_will_be_deleted', true);

        $export = WorkspaceExport::query()->withoutGlobalScopes()->sole();
        expect($export->reason)->toBe(WorkspaceExport::REASON_ACCOUNT_DELETION);
        expect($export->status)->toBe(WorkspaceExport::STATUS_READY);
        expect($export->expires_at->equalTo($solo->fresh()->deletion_scheduled_for))->toBeTrue();
    });

    it('stops emails to someone waiting for deletion', function (): void {
        $solo = member(firm(), UserRole::Admin);
        seedFirmData($solo);
        requestDeletion($solo)->assertStatus(202);

        $this->artisan('hearings:send-reminders')->assertSuccessful();

        Mail::assertNotSent(HearingReminderMail::class);
    });
});

describe('changing your mind', function (): void {
    it('cancels the deletion when they sign in on the web', function (): void {
        $user = member(firm(), UserRole::Admin);
        requestDeletion($user)->assertStatus(202);

        freshVisit();
        $this->withHeader('Origin', config('app.url'))
            ->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Delete#2026pass'])
            ->assertOk()
            ->assertJsonPath('meta.account_deletion_cancelled', true);

        expect($user->fresh()->isDeletionPending())->toBeFalse();
        Mail::assertQueued(AccountDeletionCancelledMail::class);
        $this->travel(31)->days();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();
        expect($user->fresh()->isAnonymised())->toBeFalse();
    });

    it('cancels the deletion when they sign in on the app', function (): void {
        $user = member(firm(), UserRole::Admin);
        requestDeletion($user)->assertStatus(202);

        app('auth')->forgetGuards();
        $this->postJson('/api/v1/mobile/login', [
            'email' => $user->email, 'password' => 'Delete#2026pass', 'device_name' => 'Pixel', 'platform' => 'android',
        ])->assertOk()->assertJsonPath('meta.account_deletion_cancelled', true);

        expect($user->fresh()->isDeletionPending())->toBeFalse();
    });
});

describe('after 30 days', function (): void {
    it('does nothing before the date', function (): void {
        $user = member(firm(), UserRole::Admin);
        requestDeletion($user)->assertStatus(202);

        $this->travel(29)->days();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();

        expect($user->fresh()->isAnonymised())->toBeFalse();
    });

    it('anonymises a member but keeps the firm and its records', function (): void {
        $tenant = firm();
        $admin = member($tenant, UserRole::Admin, 'Rahim Uddin');
        $leaver = member($tenant, UserRole::Lawyer, 'Nusrat Jahan');
        $case = seedFirmData($leaver);
        app('auth')->forgetGuards();
        $this->actingAs($admin)->postJson("/api/v1/cases/{$case}/participants", ['user_public_id' => $leaver->public_id, 'role' => 'associate']);
        $leaverEmail = $leaver->email;
        requestDeletion($leaver)->assertStatus(202);

        $this->travel(31)->days();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();

        $leaver->refresh();
        expect($leaver->isAnonymised())->toBeTrue();
        expect($leaver->name)->toBe('Deleted user');
        expect($leaver->email)->not->toBe($leaverEmail);
        expect(DB::table('case_participants')->where('user_id', $leaver->id)->count())->toBe(0);

        // The firm keeps the case they created, and the audit trail now says "Deleted user".
        app('auth')->forgetGuards();
        $this->actingAs($admin)->getJson("/api/v1/cases/{$case}")->assertOk();
        expect(collect($this->getJson('/api/v1/users')->json('data'))->pluck('name')->all())->toBe(['Rahim Uddin']);
        expect(AuditLog::query()->withoutGlobalScopes()->where('user_id', $leaver->id)->where('action', 'case.created')->exists())->toBeTrue();
        expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'account.deleted')->exists())->toBeTrue();

        // Old credentials no longer work.
        freshVisit();
        $this->postJson('/api/v1/auth/login', ['email' => $leaverEmail, 'password' => 'Delete#2026pass'])->assertStatus(422);
    });

    it('deletes the workspace with its last member, keeping only accounting and audit records', function (): void {
        $tenant = firm();
        $solo = member($tenant, UserRole::Admin);
        seedFirmData($solo);
        DB::table('manual_payment_requests')->insert([
            'public_id' => (string) Str::ulid(), 'tenant_id' => $tenant->id, 'user_id' => $solo->id,
            'plan' => 'professional', 'interval' => 'monthly', 'amount' => 1500, 'currency' => 'BDT',
            'transaction_id' => 'TXN-1', 'sender_number' => '01700000000', 'sent_at' => now(),
            'screenshot_path' => 'payments/receipt.png', 'status' => 'approved',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $files = Storage::disk(config('filesystems.default'))->allFiles();
        expect($files)->not->toBeEmpty();
        requestDeletion($solo)->assertStatus(202);

        $this->travel(31)->days();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();

        // Every table holding workspace data is empty for this tenant, except the deliberate keeps.
        $leftovers = collect(Schema::getTableListing())
            ->map(fn (string $table): string => str_contains($table, '.') ? substr($table, strrpos($table, '.') + 1) : $table)
            ->filter(fn (string $table): bool => Schema::hasColumn($table, 'tenant_id'))
            ->reject(fn (string $table): bool => in_array($table, PurgeWorkspaceAction::KEPT_TABLES, true))
            ->mapWithKeys(fn (string $table): array => [$table => DB::table($table)->where('tenant_id', $tenant->id)->count()])
            ->filter();
        expect($leftovers->all())->toBe([]);

        expect(Storage::disk(config('filesystems.default'))->allFiles())->toBe([]);
        $tombstone = Tenant::query()->withTrashed()->find($tenant->id);
        expect($tombstone->trashed())->toBeTrue();
        expect($tombstone->name)->toBe('Deleted workspace');
        expect(DB::table('manual_payment_requests')->where('tenant_id', $tenant->id)->count())->toBe(1);
        // Earlier entries lose their details; only the purge's own record keeps its (non-personal) summary.
        expect(DB::table('audit_logs')->where('tenant_id', $tenant->id)->whereNotNull('metadata')->pluck('action')->all())->toBe(['account.deleted']);
        expect($solo->fresh()->isAnonymised())->toBeTrue();
    });

    it('promotes someone if the last admin leaves while only non-admins remain', function (): void {
        $tenant = firm();
        $admin = member($tenant, UserRole::Admin, 'Admin');
        $deputy = member($tenant, UserRole::Admin, 'Deputy');
        $lawyer = member($tenant, UserRole::Lawyer, 'Lawyer');
        requestDeletion($admin)->assertStatus(202);
        $deputy->forceFill(['role' => UserRole::Lawyer])->save();

        $this->travel(31)->days();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();

        expect($deputy->fresh()->role)->toBe(UserRole::Admin);
        expect($lawyer->fresh()->role)->toBe(UserRole::Lawyer);
    });

    it('is safe to run twice', function (): void {
        $solo = member(firm(), UserRole::Admin);
        requestDeletion($solo)->assertStatus(202);

        $this->travel(31)->days();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();
        $this->artisan('accounts:purge-deleted')->assertSuccessful();

        expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'account.deleted')->count())->toBe(1);
    });
});
