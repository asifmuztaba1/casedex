<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Auth\Models\DeviceToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Laravel\Sanctum\NewAccessToken;

/**
 * Response to a mobile sign-in, sign-up or token refresh. The plain-text
 * token appears here once and is never retrievable again.
 */
class MobileSessionResource extends JsonResource
{
    public function __construct(private readonly User $user, private readonly NewAccessToken $newToken)
    {
        parent::__construct($newToken);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var DeviceToken $device */
        $device = $this->newToken->accessToken;

        $this->user->loadMissing(['tenant', 'tenant.country', 'tenant.subscriptions', 'tenant.customer', 'country']);

        return [
            'token' => $this->newToken->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $device->expires_at?->toISOString(),
            'device' => [
                'public_id' => $device->public_id,
                'name' => $device->name,
                'platform' => $device->platform,
                'push_enabled' => $device->push_token !== null,
            ],
            'user' => new UserResource($this->user),
        ];
    }
}
