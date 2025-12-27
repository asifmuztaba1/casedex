<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Auth\Actions\RegisterUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request, RecordAuditLogAction $auditLog)
    {
        $credentials = $request->validated();

        if (! Auth::attempt($credentials)) {
            abort(422, __('messages.invalid_credentials'));
        }

        $request->session()->regenerate();

        $user = $request->user()?->loadMissing(['tenant', 'tenant.country', 'country']);

        $auditLog->handle('auth.login', $user, User::class, $user?->public_id);

        return new UserResource($user);
    }

    public function me(Request $request)
    {
        $user = $request->user()?->loadMissing(['tenant', 'tenant.country', 'country']);

        return new UserResource($user);
    }

    public function register(RegisterUserRequest $request, RegisterUserAction $registerUser, RecordAuditLogAction $auditLog)
    {
        $user = $registerUser->handle($request->validated());

        Auth::login($user);
        $request->session()->regenerate();

        $auditLog->handle('auth.register', $user, User::class, $user?->public_id);

        $user->loadMissing(['tenant', 'tenant.country', 'country']);

        return new UserResource($user);
    }

    public function logout(Request $request, RecordAuditLogAction $auditLog)
    {
        $user = $request->user();

        $auditLog->handle('auth.logout', $user, User::class, $user?->public_id);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
