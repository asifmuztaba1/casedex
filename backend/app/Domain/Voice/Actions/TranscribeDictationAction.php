<?php

namespace App\Domain\Voice\Actions;

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Voice\Services\ElevenLabsClient;
use App\Domain\Voice\Services\VoiceSettings;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Dictation: a short recording becomes text the lawyer reviews in the form
 * before saving anything. The audio goes straight to ElevenLabs and is not
 * stored by CaseDex. Billed from AI credits per started block of seconds.
 */
class TranscribeDictationAction
{
    public function __construct(
        private readonly VoiceSettings $settings,
        private readonly ElevenLabsClient $elevenLabs,
        private readonly AiCreditService $credits,
        private readonly RecordAuditLogAction $auditLog,
    ) {
    }

    /**
     * @return array{text: string, language_code: ?string, duration_seconds: int, credits_charged: int}
     */
    public function handle(User $user, UploadedFile $audio, int $declaredSeconds, ?string $languageCode): array
    {
        if (! $this->settings->isAvailable()) {
            $this->fail(503, 'voice_unavailable', __('messages.voice_unavailable'));
        }
        if ($user->voice_consent_at === null) {
            $this->fail(403, 'voice_consent_required', __('messages.voice_consent_required'));
        }

        $tenant = $user->tenant;
        $estimate = $this->creditsFor($declaredSeconds);
        $wallet = $this->credits->grantMonthlyIfDue($tenant);
        if ($wallet->free_balance + $wallet->paid_balance < $estimate) {
            $this->fail(402, 'insufficient_credits', __('messages.voice_insufficient_credits'));
        }

        try {
            $result = $this->elevenLabs->transcribe($audio, $languageCode);
        } catch (Throwable $e) {
            Log::warning('voice.transcription_failed', ['tenant_id' => $tenant->id, 'user_id' => $user->id, 'error' => $e->getMessage()]);
            $this->fail(502, 'transcription_failed', __('messages.voice_transcription_failed'));
        }

        // Bill the longer of what the app reported and what was heard.
        $seconds = (int) ceil(max($declaredSeconds, $result['duration_seconds']));
        $charged = $this->creditsFor($seconds);
        try {
            $this->credits->consume($tenant, $user, AiFeature::VoiceDictation, $charged, ['seconds' => $seconds]);
        } catch (\RuntimeException) {
            // Credits spent elsewhere between the check and now: keep the text, log it unbilled.
            $charged = 0;
            Log::warning('voice.dictation_unbilled', ['tenant_id' => $tenant->id, 'user_id' => $user->id, 'seconds' => $seconds]);
        }

        $this->auditLog->handle('voice.transcribed', $user, null, null, ['seconds' => $seconds, 'credits' => $charged]);

        return [
            'text' => $result['text'],
            'language_code' => $result['language_code'],
            'duration_seconds' => $seconds,
            'credits_charged' => $charged,
        ];
    }

    public function creditsFor(int $seconds): int
    {
        $perCredit = max(1, (int) config('billing.ai.voice.dictation_seconds_per_credit', 120));

        return max(1, (int) ceil($seconds / $perCredit));
    }

    private function fail(int $status, string $code, string $message): never
    {
        throw new HttpResponseException(response()->json(['message' => $message, 'error' => $code], $status));
    }
}
