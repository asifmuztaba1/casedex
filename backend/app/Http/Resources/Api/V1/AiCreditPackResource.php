<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiCreditPackResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'code' => $this->code,
            'name' => $this->name,
            'credits' => $this->credits,
            'price_usd_cents' => $this->price_usd_cents,
            'price_bdt' => (float) $this->price_bdt,
            'active' => $this->active,
            'sort_order' => $this->sort_order,
        ];
    }
}
