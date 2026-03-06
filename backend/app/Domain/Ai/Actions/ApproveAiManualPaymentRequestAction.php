<?php

namespace App\Domain\Ai\Actions;

use App\Domain\Ai\Models\AiManualPaymentRequest;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Models\User;

class ApproveAiManualPaymentRequestAction
{
    public function __construct(
        private readonly AiCreditService $creditService,
        private readonly RecordAuditLogAction $auditLog,
    ) {
    }

    public function handle(AiManualPaymentRequest $request, User $reviewer): AiManualPaymentRequest
    {
        if ($request->status !== ManualPaymentRequestStatus::Pending) {
            abort(422, __('messages.manual_payment_not_pending'));
        }

        $request->update([
            'status' => ManualPaymentRequestStatus::Approved,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        $pack = $request->pack;
        $tenant = $request->tenant;

        $this->creditService->purchase(
            $tenant,
            $request->user,
            (int) $pack->credits,
            'manual_mfs',
            [
                'manual_request_public_id' => $request->public_id,
                'pack_code' => $pack->code,
                'reviewed_by' => $reviewer->id,
            ]
        );

        $this->auditLog->handle(
            'billing.ai_manual_payment.approved',
            $reviewer,
            AiManualPaymentRequest::class,
            $request->public_id,
            [
                'transaction_id' => $request->transaction_id,
                'pack_code' => $pack->code,
            ]
        );

        return $request->fresh(['pack', 'user', 'reviewedBy']);
    }
}
