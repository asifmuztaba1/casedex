<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Domain\Auth\Actions\AuthenticateMobileDeviceAction;
use App\Domain\Auth\Actions\CancelAccountDeletionAction;
use App\Domain\Auth\Actions\IssueDeviceTokenAction;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Auth\Actions\RefreshDeviceTokenAction;
use App\Domain\Auth\Actions\RegisterUserAction;
use App\Domain\Auth\Actions\RevokeDeviceTokenAction;
use App\Domain\Auth\Models\DeviceToken;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\MobileLoginRequest;
use App\Http\Requests\Api\V1\MobileRegisterRequest;
use App\Http\Resources\Api\V1\MobileSessionResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Token auth for native apps. The web app keeps using cookie sessions
 * (AuthController); see docs/mobile-api.md.
 */
class MobileAuthController extends Controller
{
    public function login(
        MobileLoginRequest $request,
        AuthenticateMobileDeviceAction $authenticate,
        RecordAuditLogAction $auditLog,
        CancelAccountDeletionAction $cancelDeletion
    ): JsonResponse {
        ['user' => $user, 'token' => $token] = $authenticate->handle(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->string('device_name')->toString(),
            $request->input('platform')
        );

        $auditLog->handle('auth.login', $user, User::class, $user->public_id, $this->deviceMetadata($token->accessToken));
        $deletionCancelled = $cancelDeletion->handle($user);

        return (new MobileSessionResource($user, $token))
            ->additional(['meta' => ['account_deletion_cancelled' => $deletionCancelled]])
            ->response();
    }

    public function register(
        MobileRegisterRequest $request,
        RegisterUserAction $registerUser,
        IssueDeviceTokenAction $issueToken,
        RecordAuditLogAction $auditLog
    ): JsonResponse {
        $data = $request->validated();
        $user = $registerUser->handle(collect($data)->except(['device_name', 'platform'])->all());
        $token = $issueToken->handle($user, $data['device_name'], $data['platform']);

        $auditLog->handle('auth.register', $user, User::class, $user->public_id, $this->deviceMetadata($token->accessToken));

        return (new MobileSessionResource($user, $token))->response()->setStatusCode(201);
    }

    public function refresh(Request $request, RefreshDeviceTokenAction $refresh): JsonResponse
    {
        $user = $request->user();
        $token = $refresh->handle($user, $user->currentAccessToken());

        return (new MobileSessionResource($user, $token))->response();
    }

    public function logout(Request $request, RevokeDeviceTokenAction $revoke): Response
    {
        $user = $request->user();
        $revoke->handle($user->currentAccessToken(), $user, 'auth.logout');

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function deviceMetadata(DeviceToken $token): array
    {
        return [
            'channel' => 'mobile',
            'device_public_id' => $token->public_id,
            'device' => (string) $token->name,
            'platform' => $token->platform,
        ];
    }
}
