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
            'public_id' => $this->public_id,
            'client_public_id' => $this->client_id === null ? null : $this->client?->public_id,
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
