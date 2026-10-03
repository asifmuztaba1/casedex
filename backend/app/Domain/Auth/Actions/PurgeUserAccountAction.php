<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Tenancy\Actions\PurgeWorkspaceAction;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Erases an account whose grace period is over. The user row is anonymised
 * in place ("Deleted user") so cases, diary entries and the audit log keep
 * a valid author. If nobody else is left in the workspace, it is purged too.
 * Safe to run again: an anonymised user is skipped.
 */
class PurgeUserAccountAction
{
    public function __construct(
        private readonly PurgeWorkspaceAction $purgeWorkspace,
        private readonly RecordAuditLogAction $auditLog,
    ) {
    }

    public function handle(User $user): void
    {
        if ($user->isAnonymised() || ! $user->isDeletionPending()) {
            return;
        }

        $tenant = $user->tenant_id ? Tenant::query()->withTrashed()->find($user->tenant_id) : null;
        $files = [];
        $workspacePurged = false;

        if ($tenant !== null) {
            TenantContext::set($tenant->id);
        }

        try {
            DB::transaction(function () use ($user, $tenant, &$files, &$workspacePurged): void {
                $remaining = $tenant === null ? collect() : User::query()
                    ->where('tenant_id', $tenant->id)
                    ->whereKeyNot($user->getKey())
                    ->whereNull('anonymised_at')
                    ->orderBy('created_at')
                    ->get();

                if ($tenant !== null && $remaining->isEmpty() && ! $tenant->trashed()) {
                    $files = $this->purgeWorkspace->handle($tenant);
                    $workspacePurged = true;
                } elseif ($user->role === UserRole::Admin && $remaining->isNotEmpty()
                    && $remaining->every(fn (User $member): bool => $member->role !== UserRole::Admin)) {
                    // Handover is required up front; this only covers an admin whose
                    // last fellow admin left in the meantime.
                    $successor = $remaining->first();
                    $successor->forceFill(['role' => UserRole::Admin])->save();
                    $this->auditLog->handle('account.admin_promoted', $successor, User::class, $successor->public_id, ['reason' => 'previous_admin_deleted']);
                }

                $this->erasePersonalData($user, $workspacePurged);

                $this->auditLog->handle('account.deleted', $user, User::class, $user->public_id, [
                    'workspace_deleted' => $workspacePurged,
                ]);
            });
        } finally {
            TenantContext::clear();
        }

        $disk = Storage::disk(config('filesystems.default'));
        foreach ($files as $path) {
            $disk->delete($path);
        }

        Log::info('account.purged', [
            'tenant_id' => $tenant?->id,
            'user_id' => $user->id,
            'workspace_purged' => $workspacePurged,
            'files_deleted' => count($files),
        ]);
    }

    private function erasePersonalData(User $user, bool $workspacePurged): void
    {
        $user->tokens()->delete();
        PushSubscription::query()->withoutGlobalScopes()->where('user_id', $user->id)->delete();
        DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))->where('email', $user->email)->delete();
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }

        if (! $workspacePurged) {
            DB::table('case_participants')->where('user_id', $user->id)->delete();
            DB::table('case_notifications')->where('user_id', $user->id)->delete();
            DB::table('feedback')->where('user_id', $user->id)->delete();
        }

        // Their own sign-in entries name devices and IP details.
        DB::table('audit_logs')->where('user_id', $user->id)->where('action', 'like', 'auth.%')->update(['metadata' => null]);

        $user->forceFill([
            'name' => 'Deleted user',
            'email' => 'deleted-'.Str::lower($user->public_id).'@deleted.casedex.invalid',
            'password' => Str::random(64),
            'remember_token' => null,
            'email_verified_at' => null,
            'whatsapp_phone' => null,
            'whatsapp_opted_in' => false,
            'anonymised_at' => now(),
        ])->save();
    }
}
