<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'feature' => $this->feature,
            'status' => $this->status,
            'credits_cost' => $this->credits_cost,
            'credits_refunded' => $this->credits_refunded,
            'result_text' => $this->result_text,
            'result_payload' => $this->result_payload,
            'error_message' => $this->error_message,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'failed_at' => $this->failed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
