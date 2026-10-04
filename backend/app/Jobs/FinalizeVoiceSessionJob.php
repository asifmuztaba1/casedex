<?php

namespace App\Jobs;

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Voice\Actions\StartAssociateSessionAction;
use App\Domain\Voice\Models\VoiceSession;
use App\Domain\Voice\Services\ElevenLabsClient;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Bills a finished associate conversation by its real length, read from
 * ElevenLabs. Idempotent: a billed session is never charged again. While
 * ElevenLabs is still processing the call, the job waits and retries.
 */
class FinalizeVoiceSessionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 6;

    public function __construct(
        public readonly int $tenantId,
        public readonly int $sessionId
    ) {
    }

    /** @return array<int, int> */
    public function backoff(): array
    {
        return [30, 60, 120, 300, 600];
    }

    public function handle(ElevenLabsClient $elevenLabs, AiCreditService $credits): void
    {
        TenantContext::set($this->tenantId);

        try {
            $session = VoiceSession::query()->with('user')->find($this->sessionId);
            if ($session === null || in_array($session->status, [VoiceSession::BILLED, VoiceSession::FAILED], true)) {
                return;
            }
            if ($session->conversation_id === null) {
                $session->forceFill(['status' => VoiceSession::FAILED])->save();

                return;
            }

            $details = $elevenLabs->conversation($session->conversation_id);
            if ($details['duration_seconds'] === null || ! in_array($details['status'], ['done', 'failed', null], true)) {
                $this->release($this->backoff()[min($this->attempts() - 1, 4)] ?? 600);

                return;
            }

            $seconds = $details['duration_seconds'];
            $charge = $seconds > 0 ? StartAssociateSessionAction::creditsFor($seconds) : 0;
            $tenant = Tenant::query()->findOrFail($this->tenantId);

            if ($charge > 0) {
                try {
                    $credits->consume($tenant, $session->user, AiFeature::VoiceAssociate, $charge, ['seconds' => $seconds, 'voice_session' => $session->public_id]);
                } catch (\RuntimeException) {
                    // The call already happened; record it unbilled rather than fail forever.
                    Log::warning('voice.associate_unbilled', ['tenant_id' => $this->tenantId, 'voice_session_id' => $session->id, 'seconds' => $seconds]);
                    $charge = 0;
                }
            }

            $session->forceFill([
                'status' => VoiceSession::BILLED,
                'ended_at' => $session->ended_at ?? now(),
                'duration_seconds' => $seconds,
                'credits_charged' => $charge,
            ])->save();

            Log::info('voice.associate_billed', ['tenant_id' => $this->tenantId, 'voice_session_id' => $session->id, 'seconds' => $seconds, 'credits' => $charge]);
        } finally {
            TenantContext::clear();
        }
    }
}
