<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualSubscriptionChangeStatus;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use App\Models\User;
use Illuminate\Support\Carbon;

class ApproveManualSubscriptionChangeRequestAction
{
    public function __construct(
        private readonly RecordAuditLogAction $auditLog,
        private readonly ApplyManualSubscriptionChangeRequestAction $applyAction,
    ) {
    }

    public function handle(ManualSubscriptionChangeRequest $request, User $reviewer, ?string $effectiveAt = null): ManualSubscriptionChangeRequest
    {
        if ($request->status !== ManualSubscriptionChangeStatus::Pending) {
            abort(422, 'Only pending requests can be approved.');
        }

        $request->update([
            'status' => ManualSubscriptionChangeStatus::Approved,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
            'effective_at' => $effectiveAt ? Carbon::parse($effectiveAt) : $request->effective_at,
        ]);

        $this->auditLog->handle(
            'billing.manual_subscription_change.approved',
            $reviewer,
            ManualSubscriptionChangeRequest::class,
            $request->public_id,
            ['type' => $request->type?->value]
        );

        if ($request->effective_at->lessThanOrEqualTo(now())) {
            return $this->applyAction->handle($request->fresh());
        }

        return $request->fresh(['tenant', 'requester', 'reviewer']);
    }
}
