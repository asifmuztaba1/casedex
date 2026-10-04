<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Voice\Actions\GiveVoiceConsentAction;
use App\Domain\Voice\Actions\TranscribeDictationAction;
use App\Domain\Voice\Services\VoiceSettings;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\TranscribeDictationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Voice features for workspace users: what is available, consent, and
 * dictation (speech to text for notes the lawyer reviews before saving).
 */
class VoiceController extends Controller
{
    public function status(Request $request, VoiceSettings $settings): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => [
            'dictation_available' => $settings->isAvailable(),
            'consent_given' => $user->voice_consent_at !== null,
            'max_seconds' => (int) config('billing.ai.voice.dictation_max_seconds', 180),
            'seconds_per_credit' => (int) config('billing.ai.voice.dictation_seconds_per_credit', 120),
            'zero_retention' => $settings->zeroRetention(),
        ]]);
    }

    public function consent(Request $request, GiveVoiceConsentAction $consent): JsonResponse
    {
        $consent->handle($request->user());

        return response()->json(['data' => ['consent_given' => true]]);
    }

    public function transcribe(TranscribeDictationRequest $request, TranscribeDictationAction $transcribe): JsonResponse
    {
        $result = $transcribe->handle(
            $request->user(),
            $request->file('audio'),
            (int) $request->validated('duration_seconds'),
            $request->validated('language'),
        );

        return response()->json(['data' => $result]);
    }
}
