<?php

namespace App\Domain\Ai\Actions;

use App\Domain\Ai\Models\AiManualPaymentRequest;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Models\User;

class RejectAiManualPaymentRequestAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(AiManualPaymentRequest $request, User $reviewer, ?string $reason = null): AiManualPaymentRequest
    {
        if ($request->status !== ManualPaymentRequestStatus::Pending) {
            abort(422, __('messages.manual_payment_not_pending'));
        }

        $request->update([
            'status' => ManualPaymentRequestStatus::Rejected,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $this->auditLog->handle(
            'billing.ai_manual_payment.rejected',
            $reviewer,
            AiManualPaymentRequest::class,
            $request->public_id,
            [
                'transaction_id' => $request->transaction_id,
                'reason' => $reason,
            ]
        );

        return $request->fresh(['pack', 'user', 'reviewedBy']);
    }
}
