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
            'tenant_id' => $this->tenant_id,
            'country_id' => $this->country_id,
            'country' => $this->country?->name,
            'country_code' => $this->country?->code,
            'role' => $this->role?->value,
            'locale' => $this->locale,
            'tenant_locale' => $this->tenant?->locale,
        ];
    }
}
