<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AuthVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash, RecordAuditLogAction $auditLog)
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();

            $auditLog->handle('auth.email_verified', $user, User::class, $user->public_id);
        }

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return redirect()->away($frontendUrl.'/login?verified=1');
    }

    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->noContent();
        }

        $user->sendEmailVerificationNotification();

        return response()->noContent();
    }
}
