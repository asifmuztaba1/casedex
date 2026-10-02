<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Auth\Models\DeviceToken;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domain\Auth\Models\DeviceToken */
class DeviceTokenResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $current = $request->user()?->currentAccessToken();

        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'platform' => $this->platform,
            'push_enabled' => $this->push_token !== null,
            // True for the device making this request; always false from a browser session.
            'is_current' => (bool) ($current instanceof DeviceToken && $current->getKey() === $this->getKey()),
            'last_used_at' => $this->last_used_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
