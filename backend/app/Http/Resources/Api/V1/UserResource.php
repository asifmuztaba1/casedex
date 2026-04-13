<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'tenant_id' => $this->tenant_id,
            'tenant' => new TenantResource($this->whenLoaded('tenant')),
            'country_id' => $this->country_id,
            'country' => $this->country?->name,
            'country_code' => $this->country?->code,
            'role' => $this->role?->value,
            'locale' => $this->locale,
            'tenant_locale' => $this->tenant?->locale,
            'whatsapp_phone' => $this->whatsapp_phone,
            'whatsapp_opted_in' => (bool) $this->whatsapp_opted_in,
            'pwa_installed_at' => $this->pwa_installed_at,
        ];
    }
}
