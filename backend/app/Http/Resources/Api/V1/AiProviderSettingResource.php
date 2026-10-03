<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Ai\Services\AiProviderCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One provider in Admin → AI. The API key is never returned; only whether
 * one is saved and its last four characters, to tell keys apart.
 *
 * @mixin \App\Domain\Ai\Models\AiProviderSetting
 */
class AiProviderSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $preset = AiProviderCatalog::all()[$this->provider];
        $key = (string) ($this->api_key ?? '');

        return [
            'provider' => $this->provider,
            'label' => $preset['label'],
            'model' => $this->model ?: $preset['default_model'],
            'base_url' => $this->base_url ?: $preset['base_url'],
            'has_api_key' => $key !== '',
            'api_key_last4' => $key !== '' ? substr($key, -4) : null,
            'is_active' => (bool) $this->is_active,
            'last_tested_at' => $this->last_tested_at?->toISOString(),
            'last_test_ok' => $this->last_test_ok,
            'updated_by' => $this->editor?->name,
            'updated_at' => $this->updated_at?->toISOString(),
            'default_model' => $preset['default_model'],
            'suggested_models' => $preset['suggested_models'],
            'key_url' => $preset['key_url'],
        ];
    }
}
