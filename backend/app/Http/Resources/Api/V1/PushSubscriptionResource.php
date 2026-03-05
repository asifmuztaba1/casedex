<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PushSubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'endpoint' => $this->endpoint,
            'endpoint_hash' => $this->endpoint_hash,
            'content_encoding' => $this->content_encoding,
            'created_at' => $this->created_at,
            'last_used_at' => $this->last_used_at,
        ];
    }
}
