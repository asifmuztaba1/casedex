<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'subject' => $this->subject,
            'status' => $this->status->value,
            'user' => [
                'public_id' => $this->user?->public_id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'public_id' => $this->assignee->public_id,
                'name' => $this->assignee->name,
            ] : null),
            'latest_message' => $this->whenLoaded('latestMessage', fn () => $this->latestMessage ? [
                'body' => $this->latestMessage->body,
                'user_name' => $this->latestMessage->user?->name,
                'created_at' => $this->latestMessage->created_at,
            ] : null),
            'closed_at' => $this->closed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
