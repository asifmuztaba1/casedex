<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class SupportMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attachmentUrl = null;

        if ($this->attachment_path) {
            $attachmentUrl = URL::temporarySignedRoute(
                'api.v1.support.attachment',
                now()->addMinutes(30),
                ['messagePublicId' => $this->public_id],
                false
            );
        }

        return [
            'public_id' => $this->public_id,
            'body' => $this->body,
            'user' => [
                'public_id' => $this->user?->public_id,
                'name' => $this->user?->name,
                'role' => $this->user?->role?->value,
            ],
            'attachment_name' => $this->attachment_name,
            'attachment_mime' => $this->attachment_mime,
            'attachment_size' => $this->attachment_size,
            'attachment_url' => $attachmentUrl,
            'created_at' => $this->created_at,
        ];
    }
}
