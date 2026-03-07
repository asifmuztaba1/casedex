<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmitManualPaymentRequestAction
{
    public function __construct(
        private readonly PlanFeatureService $planFeatureService,
        private readonly RecordAuditLogAction $auditLog
    )
    {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function handle(Tenant $tenant, User $user, array $data, UploadedFile $screenshot): ManualPaymentRequest
    {
        if (! $this->planFeatureService->isManualMfsAvailableForTenant($tenant)) {
            abort(422, __('messages.manual_payment_country_restricted'));
        }

        if (! $this->planFeatureService->canSubmitManualSubscriptionPayment($tenant)) {
            abort(422, __('messages.manual_payment_trial_not_ended'));
        }

        $pending = ManualPaymentRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', ManualPaymentRequestStatus::Pending->value)
            ->latest('id')
            ->first();

        if ($pending !== null) {
            if ($pending->temporary_access_expires_at !== null && $pending->temporary_access_expires_at->isPast()) {
                $pending->status = ManualPaymentRequestStatus::Expired;
                $pending->save();
            } else {
                abort(422, __('messages.manual_payment_pending_exists'));
            }
        }

        if (
            ManualPaymentRequest::query()
                ->where('transaction_id', $data['transaction_id'])
                ->exists()
        ) {
            abort(422, __('validation.unique', ['attribute' => 'transaction_id']));
        }

        $plan = TenantPlan::from((string) $data['plan']);
        $interval = (string) $data['interval'];
        $expectedAmount = $this->planFeatureService->manualMfsPriceFor($plan, $interval);
        $submittedAmount = round((float) $data['amount'], 2);

        if ($expectedAmount === null || abs($expectedAmount - $submittedAmount) > 0.00001) {
            abort(422, __('messages.manual_payment_amount_mismatch'));
        }

        $extension = $screenshot->getClientOriginalExtension();
        $filename = (string) Str::ulid().($extension ? '.'.$extension : '');
        $storageKey = sprintf(
            'tenants/%s/billing/manual-payments/%s',
            $tenant->id,
            $filename
        );
        $disk = (string) config('filesystems.default', 'local');

        Storage::disk($disk)->putFileAs(dirname($storageKey), $screenshot, basename($storageKey));

        $request = ManualPaymentRequest::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'plan' => $plan->value,
            'interval' => $interval,
            'amount' => $submittedAmount,
            'currency' => (string) config('billing.manual_mfs.currency', 'BDT'),
            'sender_number' => $data['sender_number'],
            'transaction_id' => $data['transaction_id'],
            'sent_at' => $data['sent_at'],
            'screenshot_disk' => $disk,
            'screenshot_path' => $storageKey,
            'status' => ManualPaymentRequestStatus::Pending->value,
            'temporary_access_expires_at' => now()->addHours((int) config('billing.manual_mfs.temporary_access_hours', 24)),
        ]);

        $this->auditLog->handle(
            'billing.manual_payment.submitted',
            $user,
            ManualPaymentRequest::class,
            $request->public_id,
            ['transaction_id' => $request->transaction_id]
        );

        $this->notifyTenantAdmins($tenant, $user, 'Manual payment submitted', 'Your payment request is pending admin approval.');

        return $request->fresh(['tenant', 'user']);
    }

    private function notifyTenantAdmins(Tenant $tenant, User $actor, string $title, string $body): void
    {
        TenantContext::set($tenant->id);

        try {
            $adminUsers = User::query()
                ->where('tenant_id', $tenant->id)
                ->where('role', 'admin')
                ->get(['id']);

            foreach ($adminUsers as $adminUser) {
                foreach (['in_app', 'email'] as $channel) {
                    $notification = CaseNotification::query()->create([
                        'tenant_id' => $tenant->id,
                        'case_id' => null,
                        'user_id' => $adminUser->id,
                        'hearing_id' => null,
                        'notification_type' => 'billing_manual_payment_submitted',
                        'channel' => $channel,
                        'title' => $title,
                        'body' => $body,
                        'status' => 'pending',
                        'scheduled_for' => now(),
                        'sent_at' => now(),
                    ]);

                    DispatchCaseNotificationJob::dispatch($tenant->id, $notification->id);
                }
            }
        } finally {
            TenantContext::clear();
        }
    }
}
