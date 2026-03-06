<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiManualPaymentRequestResource extends JsonResource
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
            'pack' => $this->pack ? [
                'public_id' => $this->pack->public_id,
                'code' => $this->pack->code,
                'name' => $this->pack->name,
                'credits' => $this->pack->credits,
            ] : null,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'sender_number' => $this->sender_number,
            'transaction_id' => $this->transaction_id,
            'sent_at' => $this->sent_at,
            'status' => $this->status?->value,
            'reviewed_by_public_id' => $this->reviewedBy?->public_id,
            'reviewed_by_name' => $this->reviewedBy?->name,
            'reviewed_at' => $this->reviewed_at,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at,
            'screenshot_download_url' => route('api.v1.admin.ai-manual-payments.screenshot', ['publicId' => $this->public_id]),
        ];
    }
}
