<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Ai\Actions\TestAiProviderAction;
use App\Domain\Ai\Models\AiProviderSetting;
use App\Domain\Ai\Services\AiProviderCatalog;
use App\Domain\Ai\Services\AiProviderFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateAiProviderRequest;
use App\Http\Resources\Api\V1\AiProviderSettingResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

/**
 * Admin → AI: which provider and model CaseDex uses for every workspace.
 * Platform admins edit; platform editors can only look.
 */
class AiProviderController extends Controller
{
    public function index(AiProviderFactory $factory): JsonResponse
    {
        $saved = AiProviderSetting::query()->with('editor')->get()->keyBy('provider');
        $providers = collect(AiProviderCatalog::keys())
            ->map(fn (string $key): AiProviderSetting => $saved[$key] ?? new AiProviderSetting(['provider' => $key, 'model' => '']))
            ->values();

        $inUse = $factory->activeConfig();

        return response()->json([
            'data' => AiProviderSettingResource::collection($providers)->resolve(),
            'meta' => [
                // What AI requests use right now: admin:<provider>, or env until one is active.
                'in_use' => [
                    'source' => $inUse->source,
                    'model' => $inUse->model,
                    'configured' => $inUse->apiKey !== '' && $inUse->baseUrl !== '',
                ],
                'can_edit' => Gate::allows('manage-platform-ai'),
            ],
        ]);
    }

    public function update(string $provider, UpdateAiProviderRequest $request): AiProviderSettingResource
    {
        Gate::authorize('manage-platform-ai');

        $setting = AiProviderSetting::query()->firstOrNew(['provider' => $provider]);
        $setting->model = $request->validated('model');
        $setting->base_url = $request->validated('base_url');
        $keyChanged = filled($request->validated('api_key'));
        if ($keyChanged) {
            $setting->api_key = $request->validated('api_key');
            $setting->last_tested_at = null;
            $setting->last_test_ok = null;
        }
        $setting->updated_by = $request->user()->id;
        $setting->save();

        Log::info('ai.provider_updated', [
            'provider' => $provider,
            'model' => $setting->model,
            'key_changed' => $keyChanged,
            'admin_user_id' => $request->user()->id,
        ]);

        return new AiProviderSettingResource($setting->load('editor'));
    }

    public function test(string $provider, TestAiProviderAction $test): JsonResponse
    {
        Gate::authorize('manage-platform-ai');

        $setting = AiProviderSetting::query()->where('provider', $provider)->first();
        if ($setting === null || blank($setting->api_key)) {
            return response()->json(['message' => __('messages.ai_provider_key_missing')], 422);
        }

        return response()->json(['data' => $test->handle($setting)]);
    }

    public function activate(string $provider, Request $request): AiProviderSettingResource
    {
        Gate::authorize('manage-platform-ai');

        $setting = AiProviderSetting::query()->where('provider', $provider)->first();
        abort_if($setting === null || blank($setting->api_key), 422, __('messages.ai_provider_key_missing'));

        DB::transaction(function () use ($setting, $request): void {
            AiProviderSetting::query()->whereKeyNot($setting->getKey())->update(['is_active' => false]);
            $setting->forceFill(['is_active' => true, 'updated_by' => $request->user()->id])->save();
        });

        Log::info('ai.provider_activated', ['provider' => $provider, 'model' => $setting->model, 'admin_user_id' => $request->user()->id]);

        return new AiProviderSettingResource($setting->load('editor'));
    }

    /** Stop using any admin-chosen provider; AI falls back to the .env settings. */
    public function deactivate(Request $request): JsonResponse
    {
        Gate::authorize('manage-platform-ai');

        AiProviderSetting::query()->update(['is_active' => false]);
        Log::info('ai.provider_deactivated', ['admin_user_id' => $request->user()->id]);

        return response()->json(['data' => ['source' => 'env']]);
    }
}
