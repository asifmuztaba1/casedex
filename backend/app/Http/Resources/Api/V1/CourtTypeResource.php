<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourtTypeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'name_bn' => $this->name_bn,
            'country_id' => $this->country_id,
            'created_at' => $this->created_at,
        ];
    }
}
