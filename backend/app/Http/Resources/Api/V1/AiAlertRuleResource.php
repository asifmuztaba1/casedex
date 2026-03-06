<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiAlertRuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'threshold_credits' => $this->threshold_credits,
            'channel_in_app' => $this->channel_in_app,
            'channel_email' => $this->channel_email,
            'is_active' => $this->is_active,
            'last_triggered_at' => $this->last_triggered_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
