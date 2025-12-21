<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiaryEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'case_id' => $this->case_id,
            'entry_date' => $this->entry_date,
            'content' => $this->content,
            'created_at' => $this->created_at,
        ];
    }
}
