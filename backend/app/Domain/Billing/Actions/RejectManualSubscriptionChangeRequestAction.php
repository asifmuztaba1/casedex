<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualSubscriptionChangeStatus;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use App\Models\User;

class RejectManualSubscriptionChangeRequestAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(ManualSubscriptionChangeRequest $request, User $reviewer, ?string $reason = null): ManualSubscriptionChangeRequest
    {
        if ($request->status !== ManualSubscriptionChangeStatus::Pending) {
            abort(422, 'Only pending requests can be rejected.');
        }

        $request->update([
            'status' => ManualSubscriptionChangeStatus::Rejected,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $this->auditLog->handle(
            'billing.manual_subscription_change.rejected',
            $reviewer,
            ManualSubscriptionChangeRequest::class,
            $request->public_id,
            ['reason' => $reason]
        );

        return $request->fresh(['tenant', 'requester', 'reviewer']);
    }
}
