<?php

namespace App\Domain\Ai\Actions;

use App\Domain\Ai\Models\AiCreditPack;
use App\Domain\Ai\Models\AiManualPaymentRequest;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmitAiManualPaymentRequestAction
{
    public function __construct(
        private readonly PlanFeatureService $planFeatureService,
        private readonly RecordAuditLogAction $auditLog,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function handle(Tenant $tenant, User $user, array $data, UploadedFile $screenshot): AiManualPaymentRequest
    {
        if (! $this->planFeatureService->isManualMfsAvailableForTenant($tenant)) {
            abort(422, __('messages.manual_payment_country_restricted'));
        }

        $pending = AiManualPaymentRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', ManualPaymentRequestStatus::Pending->value)
            ->latest('id')
            ->first();

        if ($pending !== null) {
            abort(422, __('messages.manual_payment_pending_exists'));
        }

        if (AiManualPaymentRequest::query()->where('transaction_id', $data['transaction_id'])->exists()) {
            abort(422, __('validation.unique', ['attribute' => 'transaction_id']));
        }

        $pack = AiCreditPack::query()
            ->where('public_id', $data['pack_public_id'])
            ->where('active', true)
            ->first();

        if ($pack === null) {
            abort(422, 'AI credit pack not found.');
        }

        $submittedAmount = round((float) $data['amount'], 2);
        if (abs((float) $pack->price_bdt - $submittedAmount) > 0.00001) {
            abort(422, __('messages.manual_payment_amount_mismatch'));
        }

        $extension = $screenshot->getClientOriginalExtension();
        $filename = (string) Str::ulid().($extension ? '.'.$extension : '');
        $storageKey = sprintf('tenants/%s/billing/ai-manual-payments/%s', $tenant->id, $filename);
        $disk = (string) config('filesystems.default', 'local');

        Storage::disk($disk)->putFileAs(dirname($storageKey), $screenshot, basename($storageKey));

        TenantContext::set($tenant->id);

        try {
            $request = AiManualPaymentRequest::query()->create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'ai_credit_pack_id' => $pack->id,
                'amount' => $submittedAmount,
                'currency' => (string) config('billing.manual_mfs.currency', 'BDT'),
                'sender_number' => $data['sender_number'],
                'transaction_id' => $data['transaction_id'],
                'sent_at' => $data['sent_at'],
                'screenshot_disk' => $disk,
                'screenshot_path' => $storageKey,
                'status' => ManualPaymentRequestStatus::Pending->value,
            ]);
        } finally {
            TenantContext::clear();
        }

        $this->auditLog->handle(
            'billing.ai_manual_payment.submitted',
            $user,
            AiManualPaymentRequest::class,
            $request->public_id,
            [
                'transaction_id' => $request->transaction_id,
                'pack_code' => $pack->code,
            ]
        );

        $adminUsers = User::query()->where('tenant_id', $tenant->id)->where('role', 'admin')->get(['id']);
        TenantContext::set($tenant->id);
        try {
            foreach ($adminUsers as $adminUser) {
                $notification = CaseNotification::query()->create([
                    'tenant_id' => $tenant->id,
                    'case_id' => null,
                    'user_id' => $adminUser->id,
                    'hearing_id' => null,
                    'notification_type' => 'billing_ai_manual_payment_submitted',
                    'channel' => 'in_app',
                    'title' => 'AI credit payment submitted',
                    'body' => 'Your AI credit payment request is pending admin approval.',
                    'status' => 'pending',
                    'scheduled_for' => now(),
                    'sent_at' => now(),
                ]);

                DispatchCaseNotificationJob::dispatch($tenant->id, $notification->id);
            }
        } finally {
            TenantContext::clear();
        }

        return $request->fresh(['pack', 'user']);
    }
}
