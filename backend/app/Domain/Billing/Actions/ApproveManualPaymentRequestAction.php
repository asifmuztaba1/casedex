<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use LemonSqueezy\Laravel\Subscription;

class ApproveManualPaymentRequestAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(ManualPaymentRequest $request, User $reviewer): ManualPaymentRequest
    {
        if ($request->status !== ManualPaymentRequestStatus::Pending) {
            abort(422, __('messages.manual_payment_not_pending'));
        }

        $startAt = $request->sent_at;
        $endAt = $request->interval === 'yearly'
            ? $startAt->copy()->addYear()
            : $startAt->copy()->addMonth();

        $request->update([
            'status' => ManualPaymentRequestStatus::Approved,
            'temporary_access_expires_at' => null,
            'approved_starts_at' => $startAt,
            'approved_ends_at' => $endAt,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        // Mirror manual MFS approval into the subscription table so system state is consistent
        // across payment sources (Lemon + manual).
        $request->tenant->subscriptions()->updateOrCreate(
            [
                'lemon_squeezy_id' => 'manual_mfs_'.$request->public_id,
            ],
            [
                'type' => 'manual_mfs',
                'status' => Subscription::STATUS_ACTIVE,
                'product_id' => 'manual_mfs',
                'variant_id' => sprintf('manual_mfs:%s:%s', $request->plan->value, $request->interval),
                'trial_ends_at' => null,
                'renews_at' => null,
                'ends_at' => $endAt,
            ]
        );

        $request->tenant->update([
            'plan' => TenantPlan::from($request->plan->value),
        ]);

        TenantContext::set($request->tenant_id);

        try {
            $this->auditLog->handle(
                'billing.manual_payment.approved',
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
                        'notification_type' => 'billing_manual_payment_approved',
                        'channel' => $channel,
                        'title' => 'Manual payment approved',
                        'body' => 'Your manual payment has been approved. Workspace access is active.',
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
