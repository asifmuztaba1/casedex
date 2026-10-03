<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domain\Platform\Models\InviteCode */
class InviteCodeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'code' => $this->code,
            'label' => $this->label,
            // active | used_up | expired | revoked
            'status' => $this->status(),
            'max_uses' => $this->max_uses,
            'uses_count' => $this->uses_count,
            'expires_at' => $this->expires_at?->toISOString(),
            'revoked_at' => $this->revoked_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'created_by' => $this->creator?->name,
            'signup_url' => rtrim((string) config('app.frontend_url'), '/').'/register?invite='.$this->code,
            'redeemed_by' => $this->whenLoaded('users', fn () => $this->users->map(fn ($user): array => [
                'name' => $user->name,
                'email' => $user->email,
                'workspace' => $user->tenant?->name,
                'signed_up_at' => $user->created_at?->toISOString(),
            ])->values()),
        ];
    }
}
