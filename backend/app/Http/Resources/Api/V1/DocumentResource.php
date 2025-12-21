<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'case_id' => $this->case_id,
            'document_type' => $this->document_type?->value,
            'title' => $this->title,
            'file_path' => $this->file_path,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
        ];
    }
}
