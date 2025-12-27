<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CasePartyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_id' => $this->case_id,
            'client_id' => $this->client_id,
            'type' => $this->type?->value,
            'name' => $this->name,
            'side' => $this->side?->value,
            'role' => $this->role?->value,
            'is_client' => (bool) $this->is_client,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'identity_number' => $this->identity_number,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
