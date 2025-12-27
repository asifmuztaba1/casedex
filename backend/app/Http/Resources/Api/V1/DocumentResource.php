<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $downloadUrl = null;

        if ($this->public_id) {
            $downloadUrl = URL::temporarySignedRoute(
                'api.v1.documents.download',
                now()->addMinutes(30),
                ['publicId' => $this->public_id],
                false
            );
        }

        return [
            'public_id' => $this->public_id,
            'case_id' => $this->case_id,
            'case_public_id' => $this->case?->public_id,
            'case_title' => $this->case?->title,
            'hearing_id' => $this->hearing_id,
            'category' => $this->category?->value,
            'original_name' => $this->original_name,
            'mime' => $this->mime,
            'size' => $this->size,
            'storage_key' => $this->storage_key,
            'download_url' => $downloadUrl,
            'created_at' => $this->created_at,
        ];
    }
}
