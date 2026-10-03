<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\AccountDeletionPreflightAction;
use App\Domain\Auth\Actions\RequestAccountDeletionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RequestAccountDeletionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Self-service account deletion (required by the App Store and Play Store
 * for apps that create accounts). Works from the web and the mobile app.
 */
class AccountDeletionController extends Controller
{
    /** What deleting would do: blocked until admin handover? workspace deleted too? */
    public function show(Request $request, AccountDeletionPreflightAction $preflight): JsonResponse
    {
        return response()->json(['data' => $preflight->handle($request->user())]);
    }

    public function store(RequestAccountDeletionRequest $request, RequestAccountDeletionAction $requestDeletion): JsonResponse
    {
        $result = $requestDeletion->handle($request->user(), $request->validated('password'));

        // End this browser session too (tokens were revoked by the action).
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['data' => $result], 202);
    }
}
