<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Voice\Services\ElevenLabsClient;
use App\Domain\Voice\Services\VoiceSettings;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateVoiceSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

/**
 * Admin → Voice: switch voice on, store the ElevenLabs key, zero retention.
 * Platform editors can look; platform admins change it.
 */
class VoiceSettingsController extends Controller
{
    public function show(VoiceSettings $settings): JsonResponse
    {
        return response()->json(['data' => $this->summary($settings)]);
    }

    public function update(UpdateVoiceSettingsRequest $request, VoiceSettings $settings): JsonResponse
    {
        Gate::authorize('manage-platform-ai');

        $settings->update(
            (bool) $request->validated('enabled'),
            (bool) $request->validated('zero_retention'),
            $request->validated('api_key'),
            $request->user()->id,
        );

        Log::info('voice.settings_updated', [
            'enabled' => $settings->enabled(),
            'zero_retention' => $settings->zeroRetention(),
            'key_changed' => filled($request->validated('api_key')),
            'admin_user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->summary($settings)]);
    }

    public function test(VoiceSettings $settings, ElevenLabsClient $elevenLabs): JsonResponse
    {
        Gate::authorize('manage-platform-ai');

        $key = $settings->apiKey();
        if ($key === null) {
            return response()->json(['message' => __('messages.voice_key_missing')], 422);
        }

        return response()->json(['data' => $elevenLabs->testKey($key)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(VoiceSettings $settings): array
    {
        $key = $settings->apiKey();

        return [
            'enabled' => $settings->enabled(),
            'zero_retention' => $settings->zeroRetention(),
            'has_api_key' => $key !== null,
            'api_key_last4' => $key !== null ? substr($key, -4) : null,
            'available' => $settings->isAvailable(),
            'can_edit' => Gate::allows('manage-platform-ai'),
        ];
    }
}
