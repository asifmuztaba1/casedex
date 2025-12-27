<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourtResource extends JsonResource
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
            'is_active' => $this->is_active,
            'country_id' => $this->country_id,
            'division' => $this->whenLoaded('division', fn () => [
                'public_id' => $this->division->public_id,
                'name' => $this->division->name,
                'name_bn' => $this->division->name_bn,
            ]),
            'district' => $this->whenLoaded('district', fn () => [
                'public_id' => $this->district->public_id,
                'name' => $this->district->name,
                'name_bn' => $this->district->name_bn,
            ]),
            'court_type' => $this->whenLoaded('type', fn () => [
                'public_id' => $this->type->public_id,
                'name' => $this->type->name,
                'name_bn' => $this->type->name_bn,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
