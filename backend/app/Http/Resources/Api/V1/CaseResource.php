<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'title' => $this->title,
            'court' => $this->court,
            'court_id' => $this->court_id,
            'court_public_id' => $this->whenLoaded('court', fn () => optional($this->court)->public_id),
            'case_number' => $this->case_number,
            'status' => $this->status?->value,
            'client' => new ClientResource($this->whenLoaded('client')),
            'created_at' => $this->created_at,
        ];
    }
}
