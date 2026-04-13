<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DailyRegisterHearingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $clientParties = $this->case?->parties?->where('side', 'client')->pluck('name')->join(', ');
        $opponentParties = $this->case?->parties?->where('side', 'opponent')->pluck('name')->join(', ');

        return [
            'public_id' => $this->public_id,
            'case_public_id' => $this->case?->public_id,
            'case_title' => $this->case?->title,
            'case_number' => $this->case?->case_number,
            'registry_case_type_bn' => $this->case?->registry_case_type_bn,
            'court' => $this->case?->court,
            'hearing_at' => $this->hearing_at,
            'type' => $this->type?->value,
            'agenda' => $this->agenda,
            'location' => $this->location,
            'outcome' => $this->outcome,
            'next_steps' => $this->next_steps,
            'client_name' => $clientParties ?: ($this->case?->client?->name ?? null),
            'opponent_name' => $opponentParties ?: null,
        ];
    }
}
