<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Voice\Actions\SyncAssociateAgentAction;
use App\Domain\Voice\Services\ElevenLabsClient;
use App\Domain\Voice\Services\VoiceSettings;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SetAssociateTenantRequest;
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

    /** Creates or updates the junior associate agent in ElevenLabs. */
    public function syncAssociate(Request $request, VoiceSettings $settings, SyncAssociateAgentAction $sync): JsonResponse
    {
        Gate::authorize('manage-platform-ai');

        if (! $settings->isAvailable()) {
            return response()->json(['message' => __('messages.voice_unavailable')], 422);
        }

        try {
            $sync->handle($request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['data' => $this->summary($settings)]);
    }

    /** Firms in the associate beta, and a search to add more. */
    public function associateTenants(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $tenants = Tenant::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->orderByDesc('voice_associate_enabled')
            ->orderBy('name')
            ->limit(50)
            ->get(['public_id', 'name', 'voice_associate_enabled']);

        return response()->json(['data' => $tenants->map(fn (Tenant $tenant): array => [
            'public_id' => $tenant->public_id,
            'name' => $tenant->name,
            'associate_enabled' => (bool) $tenant->voice_associate_enabled,
        ])->values()]);
    }

    public function setAssociateTenant(string $publicId, SetAssociateTenantRequest $request): JsonResponse
    {
        Gate::authorize('manage-platform-ai');

        $tenant = Tenant::query()->where('public_id', $publicId)->firstOrFail();
        $tenant->forceFill(['voice_associate_enabled' => (bool) $request->validated('enabled')])->save();
        Log::info('voice.associate_tenant_changed', ['tenant_id' => $tenant->id, 'enabled' => $tenant->voice_associate_enabled, 'admin_user_id' => $request->user()->id]);

        return response()->json(['data' => ['public_id' => $tenant->public_id, 'associate_enabled' => (bool) $tenant->voice_associate_enabled]]);
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
            'associate_configured' => $settings->associateAgentId() !== null,
            'can_edit' => Gate::allows('manage-platform-ai'),
        ];
    }
}
