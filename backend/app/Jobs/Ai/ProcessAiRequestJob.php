<?php

namespace App\Jobs\Ai;

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Enums\AiRequestStatus;
use App\Domain\Ai\Models\AiRequest;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Ai\Services\AiExecutionService;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessAiRequestJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        private readonly int $tenantId,
        private readonly string $requestPublicId,
    ) {
    }

    public function handle(AiCreditService $creditService, AiExecutionService $executionService): void
    {
        TenantContext::set($this->tenantId);

        try {
            $request = AiRequest::query()->where('public_id', $this->requestPublicId)->first();
            if ($request === null || ! in_array($request->status, [AiRequestStatus::Queued->value, AiRequestStatus::Running->value], true)) {
                return;
            }

            $tenant = Tenant::query()->find($this->tenantId);
            if ($tenant === null) {
                return;
            }

            $user = $request->user;
            $feature = AiFeature::from($request->feature);
            $request->status = AiRequestStatus::Running->value;
            $request->started_at = now();
            $request->error_message = null;
            $request->save();

            try {
                $spent = $creditService->consume(
                    $tenant,
                    $user,
                    $feature,
                    $request->credits_cost,
                    ['ai_request_public_id' => $request->public_id]
                );
            } catch (\RuntimeException $runtimeException) {
                if ($runtimeException->getMessage() !== 'insufficient_credits') {
                    throw $runtimeException;
                }

                $request->status = AiRequestStatus::BlockedInsufficientCredits->value;
                $request->failed_at = now();
                $request->error_message = 'Insufficient AI credits.';
                $request->save();

                return;
            }

            try {
                $result = $executionService->run($feature, $request->request_payload ?? []);

                $request->status = AiRequestStatus::Completed->value;
                $request->result_text = $result['content'];
                $request->result_payload = $result['raw'];
                $request->completed_at = now();
                $request->failed_at = null;
                $request->save();
            } catch (\Throwable $throwable) {
                $creditService->refund(
                    $tenant,
                    $user,
                    $feature,
                    (int) ($spent['spent_free'] ?? 0),
                    (int) ($spent['spent_paid'] ?? 0),
                    [
                        'ai_request_public_id' => $request->public_id,
                        'reason' => 'execution_failed',
                    ]
                );

                $request->status = AiRequestStatus::Failed->value;
                $request->failed_at = now();
                $request->error_message = $throwable->getMessage();
                $request->save();
            }
        } finally {
            TenantContext::clear();
        }
    }
}
