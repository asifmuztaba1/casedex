<?php

namespace App\Domain\Billing\Services;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Documents\Models\Document;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;

class PlanFeatureService
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function storageLimitBytes(TenantPlan $plan): int
    {
        return (int) Arr::get(
            config('billing.storage_limits', []),
            $plan->value,
            0
        );
    }

    public function getStorageUsed(Tenant $tenant): int
    {
        return (int) Document::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->sum('size');
    }

    public function hasUnlimitedStorage(Tenant $tenant): bool
    {
        $variant = (string) config('billing.addons.unlimited_storage_variant', '');

        if ($variant === '') {
            return false;
        }

        return $tenant->hasPurchasedVariant($variant);
    }

    public function getRemainingStorage(Tenant $tenant): int
    {
        if ($this->hasUnlimitedStorage($tenant)) {
            return PHP_INT_MAX;
        }

        $limit = $this->storageLimitBytes($tenant->plan ?? TenantPlan::Trial);

        return max(0, $limit - $this->getStorageUsed($tenant));
    }

    public function canUploadFile(Tenant $tenant, int $fileSizeBytes): bool
    {
        if ($this->hasUnlimitedStorage($tenant)) {
            return true;
        }

        return $this->getRemainingStorage($tenant) >= $fileSizeBytes;
    }

    public function hasAuditExport(TenantPlan $plan): bool
    {
        return in_array(
            $plan->value,
            config('billing.features.audit_export', []),
            true
        );
    }

    public function hasPrioritySupport(TenantPlan $plan): bool
    {
        return in_array(
            $plan->value,
            config('billing.features.priority_support', []),
            true
        );
    }

    public function isTrialExpired(Tenant $tenant): bool
    {
        if ($tenant->trial_ends_at === null) {
            return false;
        }

        return $tenant->trial_ends_at->isPast();
    }

    public function hasActiveSubscription(Tenant $tenant): bool
    {
        return $tenant->subscriptions()
            ->where('type', 'default')
            ->get()
            ->contains(function ($subscription): bool {
                if (! $subscription->valid()) {
                    return false;
                }

                if ($subscription->ends_at !== null && $subscription->ends_at->isPast()) {
                    return false;
                }

                return true;
            });
    }

    public function hasPaidSubscription(Tenant $tenant): bool
    {
        return $this->hasActiveSubscription($tenant)
            || $this->hasManualApprovedAccess($tenant);
    }

    public function isManualMfsAvailableForTenant(Tenant $tenant): bool
    {
        $countryCode = strtoupper((string) ($tenant->country?->code ?? ''));
        $enabledCountryCodes = array_map(
            static fn (string $code): string => strtoupper($code),
            config('billing.manual_mfs.enabled_country_codes', ['BD'])
        );

        return in_array($countryCode, $enabledCountryCodes, true);
    }

    public function manualMfsCurrency(): string
    {
        return (string) config('billing.manual_mfs.currency', 'BDT');
    }

    public function manualMfsPriceFor(TenantPlan $plan, string $interval): ?float
    {
        if ($plan === TenantPlan::Trial) {
            return null;
        }

        $value = Arr::get(
            config('billing.manual_mfs.prices', []),
            $plan->value.'.'.$interval
        );

        if ($value === null) {
            return null;
        }

        return round((float) $value, 2);
    }

    public function latestManualPaymentRequest(Tenant $tenant): ?ManualPaymentRequest
    {
        $request = ManualPaymentRequest::query()
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->first();

        if ($request === null) {
            return null;
        }

        if (
            $request->status === ManualPaymentRequestStatus::Pending
            && $request->temporary_access_expires_at !== null
            && $request->temporary_access_expires_at->isPast()
        ) {
            $this->markPendingAsExpired($request);
            $request->refresh();
        }

        return $request;
    }

    private function markPendingAsExpired(ManualPaymentRequest $request): void
    {
        $request->status = ManualPaymentRequestStatus::Expired;
        $request->save();

        TenantContext::set($request->tenant_id);

        try {
            $this->auditLog->handle(
                'billing.manual_payment.expired',
                null,
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
                        'notification_type' => 'billing_manual_payment_expired',
                        'channel' => $channel,
                        'title' => 'Manual payment request expired',
                        'body' => 'Temporary access window expired. Submit a new payment request to continue.',
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
    }

    public function hasManualPendingAccess(Tenant $tenant): bool
    {
        $request = $this->latestManualPaymentRequest($tenant);
        if ($request === null) {
            return false;
        }

        return $request->status === ManualPaymentRequestStatus::Pending
            && $request->temporary_access_expires_at !== null
            && $request->temporary_access_expires_at->isFuture();
    }

    public function hasManualApprovedAccess(Tenant $tenant): bool
    {
        $request = $this->latestManualPaymentRequest($tenant);
        if ($request === null) {
            return false;
        }

        if ($request->status !== ManualPaymentRequestStatus::Approved) {
            return false;
        }

        if ($request->approved_starts_at !== null && $request->approved_starts_at->isFuture()) {
            return false;
        }

        return $request->approved_ends_at === null || $request->approved_ends_at->isFuture();
    }

    public function manualStatus(Tenant $tenant): ?string
    {
        return $this->latestManualPaymentRequest($tenant)?->status?->value;
    }

    public function temporaryAccessExpiresAt(Tenant $tenant): ?CarbonInterface
    {
        return $this->latestManualPaymentRequest($tenant)?->temporary_access_expires_at;
    }

    public function billingSource(Tenant $tenant): string
    {
        if ($this->hasActiveSubscription($tenant)) {
            return 'lemon';
        }

        if ($this->hasManualPendingAccess($tenant) || $this->hasManualApprovedAccess($tenant)) {
            return 'manual_mfs';
        }

        return 'none';
    }

    public function hasAccess(Tenant $tenant): bool
    {
        return ! $this->isTrialExpired($tenant)
            || $this->hasActiveSubscription($tenant)
            || $this->hasManualPendingAccess($tenant)
            || $this->hasManualApprovedAccess($tenant);
    }

    public function canSubmitManualSubscriptionPayment(Tenant $tenant): bool
    {
        if ($this->hasPaidSubscription($tenant)) {
            return true;
        }

        return $this->isTrialExpired($tenant);
    }

    public function resolvePlanFromVariant(string $variantId): TenantPlan
    {
        $variants = config('billing.variants', []);

        foreach ($variants as $plan => $intervals) {
            foreach ($intervals as $variant) {
                if ((string) $variant === $variantId) {
                    return TenantPlan::from((string) $plan);
                }
            }
        }

        return TenantPlan::Trial;
    }

    public function variantIdFor(TenantPlan $plan, string $interval): ?string
    {
        if ($plan === TenantPlan::Trial) {
            return null;
        }

        $variant = Arr::get(config('billing.variants', []), $plan->value.'.'.$interval);

        if ($variant === null || $variant === '') {
            return null;
        }

        return (string) $variant;
    }

    /**
     * @return array<string, mixed>
     */
    public function planLimits(Tenant $tenant): array
    {
        $plan = $tenant->plan ?? TenantPlan::Trial;
        $storageLimit = $this->storageLimitBytes($plan);
        $storageUsed = $this->getStorageUsed($tenant);
        $hasUnlimitedStorage = $this->hasUnlimitedStorage($tenant);

        return [
            'storage_limit_bytes' => $hasUnlimitedStorage ? null : $storageLimit,
            'storage_used_bytes' => $storageUsed,
            'storage_remaining_bytes' => $hasUnlimitedStorage ? null : max(0, $storageLimit - $storageUsed),
            'has_unlimited_storage' => $hasUnlimitedStorage,
            'has_audit_export' => $this->hasAuditExport($plan),
            'has_priority_support' => $this->hasPrioritySupport($plan),
        ];
    }
}
