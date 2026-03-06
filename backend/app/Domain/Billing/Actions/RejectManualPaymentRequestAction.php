<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Notifications\Models\CaseNotification;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use LemonSqueezy\Laravel\Subscription;

class RejectManualPaymentRequestAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(ManualPaymentRequest $request, User $reviewer, ?string $reason = null): ManualPaymentRequest
    {
        if ($request->status !== ManualPaymentRequestStatus::Pending) {
            abort(422, __('messages.manual_payment_not_pending'));
        }

        $request->update([
            'status' => ManualPaymentRequestStatus::Rejected,
            'temporary_access_expires_at' => null,
            'approved_starts_at' => null,
            'approved_ends_at' => null,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $request->tenant->subscriptions()
            ->where('type', 'manual_mfs')
            ->where('lemon_squeezy_id', 'manual_mfs_'.$request->public_id)
            ->update([
                'status' => Subscription::STATUS_EXPIRED,
                'ends_at' => now(),
                'renews_at' => null,
            ]);

        TenantContext::set($request->tenant_id);

        try {
            $this->auditLog->handle(
                'billing.manual_payment.rejected',
                $reviewer,
                ManualPaymentRequest::class,
                $request->public_id,
                ['transaction_id' => $request->transaction_id]
            );

            $adminUsers = User::query()
                ->where('tenant_id', $request->tenant_id)
                ->where('role', 'admin')
                ->get(['id']);

            foreach ($adminUsers as $adminUser) {
                foreach (['in_app', 'email'] as $channel) {
                    $notification = CaseNotification::query()->create([
                        'tenant_id' => $request->tenant_id,
                        'case_id' => null,
                        'user_id' => $adminUser->id,
                        'hearing_id' => null,
                        'notification_type' => 'billing_manual_payment_rejected',
                        'channel' => $channel,
                        'title' => 'Manual payment rejected',
                        'body' => $reason !== null && $reason !== ''
                            ? 'Manual payment was rejected: '.$reason
                            : 'Manual payment was rejected. Submit a new request to restore access.',
                        'status' => 'pending',
                        'scheduled_for' => now(),
                        'sent_at' => now(),
                    ]);

                    DispatchCaseNotificationJob::dispatch($request->tenant_id, $notification->id);
                }
            }
        } finally {
            TenantContext::clear();
        }

        return $request->fresh(['tenant', 'user', 'reviewedBy']);
    }
}
