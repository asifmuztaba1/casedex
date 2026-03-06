<?php

namespace App\Domain\Billing\Services;

use App\Domain\Documents\Models\Document;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Arr;

class PlanFeatureService
{
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
        return $tenant->subscribed();
    }

    public function hasAccess(Tenant $tenant): bool
    {
        if ($this->hasActiveSubscription($tenant)) {
            return true;
        }

        return ! $this->isTrialExpired($tenant);
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
