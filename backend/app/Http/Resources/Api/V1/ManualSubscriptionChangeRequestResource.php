<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManualSubscriptionChangeRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'tenant_public_id' => $this->tenant?->public_id,
            'tenant_name' => $this->tenant?->name,
            'requested_by_public_id' => $this->requester?->public_id,
            'requested_by_name' => $this->requester?->name,
            'type' => $this->type?->value,
            'current_plan' => $this->current_plan?->value,
            'current_interval' => $this->current_interval,
            'requested_plan' => $this->requested_plan?->value,
            'requested_interval' => $this->requested_interval,
            'effective_at' => $this->effective_at,
            'status' => $this->status?->value,
            'reviewed_by_public_id' => $this->reviewer?->public_id,
            'reviewed_by_name' => $this->reviewer?->name,
            'reviewed_at' => $this->reviewed_at,
            'applied_at' => $this->applied_at,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
