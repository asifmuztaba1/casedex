<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManualPaymentMethodResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'channel' => $this->channel?->value ?? (string) $this->channel,
            'account_name' => $this->account_name,
            'receiver_number' => $this->receiver_number,
            'instructions_en' => $this->instructions_en,
            'instructions_bn' => $this->instructions_bn,
            'active' => (bool) $this->active,
            'sort_order' => (int) $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
