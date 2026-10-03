<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Billing\Actions\CancelSubscriptionAction;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Tenancy\Actions\RequestWorkspaceExportAction;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Mail\AccountDeletionScheduledMail;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Schedules an account for erasure in 30 days and signs it out everywhere.
 * Signing in before then cancels it (CancelAccountDeletionAction). If this is
 * the workspace's last member, the workspace goes too, so an export is
 * emailed and any Lemon Squeezy subscription is cancelled.
 */
class RequestAccountDeletionAction
{
    public function __construct(
        private readonly AccountDeletionPreflightAction $preflight,
        private readonly RevokeDeviceTokensAction $revokeDevices,
        private readonly RequestWorkspaceExportAction $requestExport,
        private readonly CancelSubscriptionAction $cancelSubscription,
        private readonly RecordAuditLogAction $auditLog,
    ) {
    }

    /**
     * @return array{scheduled_for: string, workspace_will_be_deleted: bool}
     */
    public function handle(User $user, string $password): array
    {
        if (! Hash::check($password, (string) $user->password)) {
            throw ValidationException::withMessages(['password' => __('messages.password_incorrect')]);
        }

        $check = $this->preflight->handle($user);
        if (! $check['can_delete']) {
            throw new HttpResponseException(response()->json([
                'message' => __('messages.deletion_handover_required'),
                'error' => 'handover_required',
            ], 409));
        }

        if (! $user->isDeletionPending()) {
            if ($check['workspace_will_be_deleted']) {
                $this->stopSubscription($user);
            }

            DB::transaction(function () use ($user): void {
                $user->forceFill([
                    'deletion_requested_at' => now(),
                    'deletion_scheduled_for' => now()->addDays(AccountDeletionPreflightAction::GRACE_DAYS),
                    'remember_token' => null,
                ])->save();

                // Signed out everywhere: phones, browsers, push.
                $this->revokeDevices->handle($user, null, 'account_deletion');
                PushSubscription::query()->withoutGlobalScopes()->where('user_id', $user->id)->delete();
                if (config('session.driver') === 'database') {
                    DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
                }
            });

            if ($check['workspace_will_be_deleted']) {
                $this->requestExport->handle($user->tenant, $user, WorkspaceExport::REASON_ACCOUNT_DELETION, $user->deletion_scheduled_for);
            }

            $this->auditLog->handle('account.deletion_requested', $user, User::class, $user->public_id, [
                'scheduled_for' => $user->deletion_scheduled_for->toISOString(),
                'workspace_will_be_deleted' => $check['workspace_will_be_deleted'],
            ]);

            Mail::to($user->email)->queue(new AccountDeletionScheduledMail($user, $check['workspace_will_be_deleted']));
        }

        return [
            'scheduled_for' => $user->deletion_scheduled_for->toISOString(),
            'workspace_will_be_deleted' => $check['workspace_will_be_deleted'],
        ];
    }

    /** A paid plan would keep billing a workspace that is being deleted. */
    private function stopSubscription(User $user): void
    {
        $subscription = $user->tenant?->subscription();
        if ($subscription === null || $subscription->cancelled() || ! $subscription->valid()) {
            return;
        }

        try {
            $this->cancelSubscription->handle($user->tenant);
        } catch (Throwable $e) {
            Log::error('account.deletion_billing_cancel_failed', ['tenant_id' => $user->tenant_id, 'error' => $e->getMessage()]);

            throw new HttpResponseException(response()->json([
                'message' => __('messages.deletion_billing_failed'),
                'error' => 'billing_cancel_failed',
            ], 503));
        }
    }
}
