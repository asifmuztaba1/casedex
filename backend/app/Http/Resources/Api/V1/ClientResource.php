<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domain\Clients\Models\Client */
class ClientResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'identity_number' => $this->identity_number,
            'notes' => $this->notes,
            'type' => $this->type?->value ?? 'person',
            'is_client' => (bool) ($this->is_client ?? true),
            'case_parties_count' => $this->whenCounted('caseParties'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
