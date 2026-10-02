<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\WallClock;

class DiaryEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'case_public_id' => $this->case?->public_id,
            'case_title' => $this->case?->title,
            'entry_at' => WallClock::toJson($this->entry_at),
            'title' => $this->title,
            'body' => $this->body,
            'created_at' => $this->created_at,
        ];
    }
}
