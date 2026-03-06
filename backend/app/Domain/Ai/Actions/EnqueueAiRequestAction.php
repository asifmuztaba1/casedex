<?php

namespace App\Domain\Ai\Actions;

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Enums\AiRequestStatus;
use App\Domain\Ai\Models\AiRequest;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\Ai\ProcessAiRequestJob;
use App\Models\User;
use App\Support\TenantContext;

class EnqueueAiRequestAction
{
    public function __construct(private readonly AiCreditService $creditService)
    {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function handle(
        Tenant $tenant,
        User $user,
        AiFeature $feature,
        string $idempotencyKey,
        array $payload
    ): AiRequest {
        $existing = AiRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        $cost = $this->creditService->featureCost($feature);

        TenantContext::set($tenant->id);

        try {
            $request = AiRequest::query()->create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'feature' => $feature->value,
                'status' => AiRequestStatus::Queued->value,
                'idempotency_key' => $idempotencyKey,
                'credits_cost' => $cost,
                'request_payload' => $payload,
            ]);
        } finally {
            TenantContext::clear();
        }

        ProcessAiRequestJob::dispatch($tenant->id, $request->public_id);

        return $request;
    }
}
