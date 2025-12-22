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
            'case_number' => $this->case_number,
            'status' => $this->status?->value,
            'client' => new ClientResource($this->whenLoaded('client')),
            'created_at' => $this->created_at,
        ];
    }
}
