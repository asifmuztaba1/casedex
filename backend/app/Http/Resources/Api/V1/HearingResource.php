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
            'case_public_id' => $this->case?->public_id,
            'case_title' => $this->case?->title,
            'hearing_at' => $this->hearing_at,
            'type' => $this->type?->value,
            'agenda' => $this->agenda,
            'location' => $this->location,
            'outcome' => $this->outcome,
            'minutes' => $this->minutes,
            'next_steps' => $this->next_steps,
            'created_at' => $this->created_at,
        ];
    }
}
