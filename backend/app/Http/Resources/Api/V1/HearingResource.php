<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HearingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'case_id' => $this->case_id,
            'hearing_type' => $this->hearing_type?->value,
            'scheduled_at' => $this->scheduled_at,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
