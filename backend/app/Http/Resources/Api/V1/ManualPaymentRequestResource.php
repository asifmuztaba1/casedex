<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManualPaymentRequestResource extends JsonResource
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
            'user_public_id' => $this->user?->public_id,
            'user_name' => $this->user?->name,
            'plan' => $this->plan?->value ?? (string) $this->plan,
            'interval' => $this->interval,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'sender_number' => $this->sender_number,
            'transaction_id' => $this->transaction_id,
            'sent_at' => $this->sent_at,
            'status' => $this->status?->value ?? (string) $this->status,
            'temporary_access_expires_at' => $this->temporary_access_expires_at,
            'approved_starts_at' => $this->approved_starts_at,
            'approved_ends_at' => $this->approved_ends_at,
            'reviewed_by_public_id' => $this->reviewedBy?->public_id,
            'reviewed_by_name' => $this->reviewedBy?->name,
            'reviewed_at' => $this->reviewed_at,
            'rejection_reason' => $this->rejection_reason,
            'screenshot_download_url' => $this->when(
                $request->user()?->role?->value === 'platform_admin' || $request->user()?->role?->value === 'platform_editor',
                '/api/v1/admin/manual-payments/'.$this->public_id.'/screenshot'
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
