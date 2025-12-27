<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourtDistrictResource extends JsonResource
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
            'division_id' => $this->division_id,
            'division' => $this->whenLoaded('division', fn () => [
                'public_id' => $this->division->public_id,
                'name' => $this->division->name,
                'name_bn' => $this->division->name_bn,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
