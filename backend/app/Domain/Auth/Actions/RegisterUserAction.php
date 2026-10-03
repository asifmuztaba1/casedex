<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Platform\Actions\RedeemInviteCodeAction;
use App\Domain\Platform\Services\RegistrationPolicy;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RegisterUserAction
{
    public function __construct(
        private readonly RegistrationPolicy $registration,
        private readonly RedeemInviteCodeAction $redeemInvite,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function handle(array $data): User
    {
        // An invalid or used-up code rolls the new account back.
        $user = DB::transaction(function () use ($data): User {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'country_id' => $data['country_id'],
                'locale' => $data['locale'] ?? config('app.locale'),
                'role' => UserRole::Viewer,
            ]);

            if ($this->registration->requiresInvite()) {
                $this->redeemInvite->handle((string) ($data['invite_code'] ?? ''), $user);
            }

            return $user;
        });

        $user->sendEmailVerificationNotification();

        return $user;
    }
}
