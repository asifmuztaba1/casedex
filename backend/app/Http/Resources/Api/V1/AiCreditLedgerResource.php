<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiCreditLedgerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'user_id' => $this->user?->public_id,
            'user_name' => $this->user?->name,
            'event_type' => $this->event_type,
            'feature' => $this->feature,
            'credits_delta' => $this->credits_delta,
            'free_delta' => $this->free_delta,
            'paid_delta' => $this->paid_delta,
            'free_balance_after' => $this->free_balance_after,
            'paid_balance_after' => $this->paid_balance_after,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
        ];
    }
}
