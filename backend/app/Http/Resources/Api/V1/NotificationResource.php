<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'case_id' => $this->case_id,
            'title' => $this->title,
            'body' => $this->body,
            'status' => $this->status,
            'scheduled_for' => $this->scheduled_for,
            'created_at' => $this->created_at,
        ];
    }
}
