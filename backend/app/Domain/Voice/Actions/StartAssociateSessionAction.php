<?php

namespace App\Domain\Voice\Actions;

use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Voice\Models\VoiceSession;
use App\Domain\Voice\Services\ElevenLabsClient;
use App\Domain\Voice\Services\VoiceSettings;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Starts a conversation with the voice associate: checks the firm is in the
 * beta, the person agreed to the voice notice and the firm has credits for
 * at least a minute, then gets a one-time token from ElevenLabs.
 */
class StartAssociateSessionAction
{
    public function __construct(
        private readonly VoiceSettings $settings,
        private readonly ElevenLabsClient $elevenLabs,
        private readonly AiCreditService $credits,
        private readonly RecordAuditLogAction $auditLog,
    ) {
    }

    /**
     * @return array{session_public_id: string, conversation_token: string, max_seconds: int, dynamic_variables: array<string, string>}
     */
    public function handle(User $user): array
    {
        $tenant = $user->tenant;
        $agentId = $this->settings->associateAgentId();

        if (! $this->settings->isAvailable() || $agentId === null || ! $tenant->voice_associate_enabled) {
            $this->fail(403, 'associate_unavailable', __('messages.voice_associate_unavailable'));
        }
        if ($user->voice_consent_at === null) {
            $this->fail(403, 'voice_consent_required', __('messages.voice_consent_required'));
        }

        $wallet = $this->credits->grantMonthlyIfDue($tenant);
        if ($wallet->free_balance + $wallet->paid_balance < self::creditsFor(60)) {
            $this->fail(402, 'insufficient_credits', __('messages.voice_insufficient_credits'));
        }

        try {
            $token = $this->elevenLabs->conversationToken($agentId);
        } catch (Throwable $e) {
            Log::warning('voice.associate_token_failed', ['tenant_id' => $tenant->id, 'user_id' => $user->id, 'error' => $e->getMessage()]);
            $this->fail(502, 'associate_failed', __('messages.voice_associate_failed'));
        }

        $session = VoiceSession::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'conversation_id' => $token['conversation_id'],
            'status' => VoiceSession::STARTED,
            'started_at' => now(),
        ]);

        $this->auditLog->handle('voice.associate_started', $user, VoiceSession::class, $session->public_id);

        $firstName = trim(explode(' ', trim((string) $user->name))[0] ?? '');
        $bangla = ($user->locale ?? $tenant->locale) === 'bn';

        return [
            'session_public_id' => $session->public_id,
            'conversation_token' => $token['token'],
            'max_seconds' => (int) config('services.elevenlabs.associate_max_seconds', 600),
            'dynamic_variables' => [
                'user_name' => (string) $user->name,
                'firm_name' => (string) $tenant->name,
                'today' => now('Asia/Dhaka')->format('l, j F Y'),
                'greeting' => $bangla
                    ? "আসসালামু আলাইকুম {$firstName}, আমি আপনার জুনিয়র। কী জানতে চান?"
                    : "Hello {$firstName}, your junior associate here. What do you need?",
            ],
        ];
    }

    public static function creditsFor(int $seconds): int
    {
        $perMinute = max(1, (int) config('billing.ai.voice.associate_credits_per_minute', 2));

        return max(1, (int) ceil($seconds / 60)) * $perMinute;
    }

    private function fail(int $status, string $code, string $message): never
    {
        throw new HttpResponseException(response()->json(['message' => $message, 'error' => $code], $status));
    }
}
