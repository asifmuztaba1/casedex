<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Domain\Auth\Actions\RevokeDeviceTokenAction;
use App\Domain\Auth\Actions\RevokeDeviceTokensAction;
use App\Domain\Auth\Actions\UpdateDevicePushTokenAction;
use App\Domain\Auth\Models\DeviceToken;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdatePushTokenRequest;
use App\Http\Resources\Api\V1\DeviceTokenResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * The signed-in user's mobile devices (from the app or the web settings
 * page), and this device's push registration.
 */
class MobileDeviceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $devices = $request->user()->tokens()
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get();

        return DeviceTokenResource::collection($devices);
    }

    public function destroy(string $publicId, Request $request, RevokeDeviceTokenAction $revoke): Response
    {
        $user = $request->user();

        /** @var DeviceToken $device */
        $device = $user->tokens()->where('public_id', $publicId)->firstOrFail();

        $revoke->handle($device, $user, 'auth.device_revoked');

        return response()->noContent();
    }

    /** Sign out every mobile device except the one asking (if it is one). */
    public function destroyAll(Request $request, RevokeDeviceTokensAction $revoke): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();

        $revoked = $revoke->handle($user, $current instanceof DeviceToken ? $current : null, 'signed_out_everywhere');

        return response()->json(['data' => ['revoked' => $revoked]]);
    }

    public function updatePushToken(UpdatePushTokenRequest $request, UpdateDevicePushTokenAction $action): DeviceTokenResource
    {
        $device = $action->handle($request->user()->currentAccessToken(), $request->validated('push_token'));

        return new DeviceTokenResource($device);
    }

    public function deletePushToken(Request $request, UpdateDevicePushTokenAction $action): Response
    {
        $action->handle($request->user()->currentAccessToken(), null);

        return response()->noContent();
    }
}
