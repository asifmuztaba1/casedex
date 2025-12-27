<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'plan' => $this->plan?->value,
            'country_id' => $this->country_id,
            'country' => $this->country?->name,
            'country_code' => $this->country?->code,
            'locale' => $this->locale,
        ];
    }
}
