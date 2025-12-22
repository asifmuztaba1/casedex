<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
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
            abort(422, 'Invalid credentials.');
        }

        $request->session()->regenerate();

        $user = $request->user();

        $auditLog->handle('auth.login', $user, User::class, $user?->public_id);

        return new UserResource($user);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request, RecordAuditLogAction $auditLog)
    {
        $user = $request->user();

        $auditLog->handle('auth.logout', $user, User::class, $user?->public_id);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
