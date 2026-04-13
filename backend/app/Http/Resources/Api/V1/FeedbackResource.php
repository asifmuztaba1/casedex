<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'trigger' => $this->trigger->value,
            'user' => [
                'public_id' => $this->user?->public_id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'created_at' => $this->created_at,
        ];
    }
}
