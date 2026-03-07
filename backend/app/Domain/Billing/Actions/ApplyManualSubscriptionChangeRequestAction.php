<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualSubscriptionChangeStatus;
use App\Domain\Billing\Enums\ManualSubscriptionChangeType;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Support\Facades\DB;
use LemonSqueezy\Laravel\Subscription;

class ApplyManualSubscriptionChangeRequestAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(ManualSubscriptionChangeRequest $request): ManualSubscriptionChangeRequest
    {
        if ($request->status !== ManualSubscriptionChangeStatus::Approved) {
            return $request;
        }

        $tenant = $request->tenant;
        $effectiveAt = $request->effective_at;

        DB::transaction(function () use ($request, $tenant, $effectiveAt): void {
            $manualSubscription = $tenant->subscriptions()
                ->where('type', 'manual_mfs')
                ->latest('id')
                ->first();

            if ($manualSubscription === null) {
                return;
            }

            if ($request->type === ManualSubscriptionChangeType::Cancel) {
                $manualSubscription->update([
                    'status' => Subscription::STATUS_CANCELLED,
                    'ends_at' => $effectiveAt,
                    'renews_at' => null,
                ]);

                ManualPaymentRequest::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'approved')
                    ->latest('id')
                    ->limit(1)
                    ->update(['approved_ends_at' => $effectiveAt]);

                if ($effectiveAt->lessThanOrEqualTo(now())) {
                    $tenant->update(['plan' => TenantPlan::Trial]);
                }
            }

            if ($request->type === ManualSubscriptionChangeType::PlanChange) {
                $requestedPlan = $request->requested_plan;
                if ($requestedPlan !== null) {
                    $tenant->update(['plan' => $requestedPlan->value]);
                    $manualSubscription->update([
                        'variant_id' => sprintf('manual_mfs:%s:%s', $requestedPlan->value, $request->requested_interval ?? 'monthly'),
                    ]);
                }
            }

            $request->update([
                'status' => ManualSubscriptionChangeStatus::Applied,
                'applied_at' => now(),
            ]);
        });

        $this->auditLog->handle(
            'billing.manual_subscription_change.applied',
            $request->reviewer,
            ManualSubscriptionChangeRequest::class,
            $request->public_id,
            ['type' => $request->type?->value]
        );

        return $request->fresh(['tenant', 'requester', 'reviewer']);
    }
}
