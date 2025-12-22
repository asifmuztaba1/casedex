<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CaseDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'title' => $this->title,
            'court' => $this->court,
            'case_number' => $this->case_number,
            'status' => $this->status?->value,
            'story' => $this->story,
            'petition_draft' => $this->petition_draft,
            'client' => new ClientResource($this->whenLoaded('client')),
            'participants' => CaseParticipantResource::collection($this->whenLoaded('participants')),
            'upcoming_hearings' => HearingResource::collection($this->whenLoaded('upcomingHearings')),
            'recent_diary_entries' => DiaryEntryResource::collection($this->whenLoaded('recentDiaryEntries')),
            'recent_documents' => DocumentResource::collection($this->whenLoaded('recentDocuments')),
            'created_at' => $this->created_at,
        ];
    }
}
