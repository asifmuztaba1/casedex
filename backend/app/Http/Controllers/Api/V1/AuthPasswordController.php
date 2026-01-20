<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\SendPasswordChangedMailAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status !== Password::RESET_LINK_SENT) {
            abort(422, __($status));
        }

        return response()->noContent();
    }

    public function reset(Request $request, SendPasswordChangedMailAction $passwordChanged)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) use ($passwordChanged, $request): void {
                $user->password = $password;
                $user->setRememberToken(Str::random(60));
                $user->save();

                event(new PasswordReset($user));
                $passwordChanged->handle($user, (string) $request->ip());
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            abort(422, __($status));
        }

        return response()->noContent();
    }
}
