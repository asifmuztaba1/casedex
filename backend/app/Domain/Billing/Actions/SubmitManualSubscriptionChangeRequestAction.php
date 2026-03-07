<?php

namespace App\Domain\Billing\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Billing\Enums\ManualSubscriptionChangeStatus;
use App\Domain\Billing\Enums\ManualSubscriptionChangeType;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SubmitManualSubscriptionChangeRequestAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function handle(Tenant $tenant, User $requester, array $data): ManualSubscriptionChangeRequest
    {
        $type = ManualSubscriptionChangeType::from((string) $data['type']);

        $manualSubscription = $tenant->subscriptions()
            ->where('type', 'manual_mfs')
            ->latest('id')
            ->first();

        if ($manualSubscription === null || ! $manualSubscription->valid()) {
            abort(422, 'Manual MFS subscription is not active for this tenant.');
        }

        $pendingExists = ManualSubscriptionChangeRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', ManualSubscriptionChangeStatus::Pending->value)
            ->exists();

        if ($pendingExists) {
            abort(422, 'A pending manual subscription change request already exists.');
        }

        $currentInterval = null;
        if (str_starts_with((string) $manualSubscription->variant_id, 'manual_mfs:')) {
            $parts = explode(':', (string) $manualSubscription->variant_id);
            $currentInterval = $parts[2] ?? null;
        }

        $changeRequest = DB::transaction(function () use ($tenant, $requester, $type, $data, $currentInterval): ManualSubscriptionChangeRequest {
            return ManualSubscriptionChangeRequest::query()->create([
                'tenant_id' => $tenant->id,
                'requested_by' => $requester->id,
                'type' => $type->value,
                'current_plan' => $tenant->plan?->value,
                'current_interval' => $currentInterval,
                'requested_plan' => $type === ManualSubscriptionChangeType::PlanChange ? $data['requested_plan'] : null,
                'requested_interval' => $type === ManualSubscriptionChangeType::PlanChange ? $data['requested_interval'] : null,
                'effective_at' => $data['effective_at'],
                'status' => ManualSubscriptionChangeStatus::Pending->value,
            ]);
        });

        $this->auditLog->handle(
            'billing.manual_subscription_change.submitted',
            $requester,
            ManualSubscriptionChangeRequest::class,
            $changeRequest->public_id,
            ['type' => $type->value]
        );

        return $changeRequest->fresh(['tenant', 'requester', 'reviewer']);
    }
}
