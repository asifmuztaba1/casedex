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
            'case_public_id' => $this->case?->public_id,
            'case_title' => $this->case?->title,
            'user_id' => $this->user_id,
            'hearing_id' => $this->hearing_id,
            'notification_type' => $this->notification_type,
            'channel' => $this->channel,
            'title' => $this->title,
            'body' => $this->body,
            'status' => $this->status,
            'scheduled_for' => $this->scheduled_for,
            'sent_at' => $this->sent_at,
            'created_at' => $this->created_at,
        ];
    }
}
