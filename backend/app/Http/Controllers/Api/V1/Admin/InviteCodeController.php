<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Platform\Actions\CreateInviteCodeAction;
use App\Domain\Platform\Models\InviteCode;
use App\Domain\Platform\Services\RegistrationPolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInviteCodeRequest;
use App\Http\Requests\Api\V1\UpdateRegistrationModeRequest;
use App\Http\Resources\Api\V1\InviteCodeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

/**
 * Admin → Invites: private-beta invite codes and whether sign-up needs one.
 * Platform editors can look; platform admins make changes.
 */
class InviteCodeController extends Controller
{
    public function index(RegistrationPolicy $registration): JsonResponse
    {
        $codes = InviteCode::query()->with(['creator', 'users.tenant'])->latest()->limit(200)->get();

        return response()->json([
            'data' => InviteCodeResource::collection($codes)->resolve(),
            'meta' => [
                'registration_mode' => $registration->mode(),
                'can_edit' => Gate::allows('manage-platform-access'),
            ],
        ]);
    }

    public function store(StoreInviteCodeRequest $request, CreateInviteCodeAction $create): JsonResponse
    {
        Gate::authorize('manage-platform-access');

        $data = $request->validated();

        $invite = $create->handle($request->user(), $data['label'] ?? null, (int) $data['max_uses'], $data['expires_in_days'] ?? null);
        Log::info('invite.created', ['invite_id' => $invite->id, 'max_uses' => $invite->max_uses, 'admin_user_id' => $request->user()->id]);

        return (new InviteCodeResource($invite->load('creator', 'users')))->response()->setStatusCode(201);
    }

    public function revoke(string $publicId, Request $request): InviteCodeResource
    {
        Gate::authorize('manage-platform-access');

        $invite = InviteCode::query()->where('public_id', $publicId)->firstOrFail();
        $invite->forceFill(['revoked_at' => $invite->revoked_at ?? now()])->save();
        Log::info('invite.revoked', ['invite_id' => $invite->id, 'admin_user_id' => $request->user()->id]);

        return new InviteCodeResource($invite->load('creator', 'users.tenant'));
    }

    public function updateRegistrationMode(UpdateRegistrationModeRequest $request, RegistrationPolicy $registration): JsonResponse
    {
        Gate::authorize('manage-platform-access');

        $mode = $request->validated('mode');

        $registration->setMode($mode, $request->user()->id);
        Log::info('registration.mode_changed', ['mode' => $mode, 'admin_user_id' => $request->user()->id]);

        return response()->json(['data' => ['registration_mode' => $registration->mode()]]);
    }
}
