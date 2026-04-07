<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

class ClientDetailResource extends ClientResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $base = parent::toArray($request);

        $base['case_history'] = $this->whenLoaded('caseParties', function () {
            return $this->caseParties
                ->filter(fn ($party) => $party->case !== null)
                ->map(fn ($party) => [
                    'case_public_id' => $party->case->public_id,
                    'title' => $party->case->title,
                    'case_number' => $party->case->case_number,
                    'status' => $party->case->status?->value ?? $party->case->status,
                    'party_side' => $party->side?->value ?? $party->side,
                    'party_role' => $party->role?->value ?? $party->role,
                    'party_type' => $party->type?->value ?? $party->type,
                ])
                ->values();
        });

        return $base;
    }
}
