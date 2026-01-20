<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Models\User;

class RegisterUserAction
{
    /**
     * @param array<string, mixed> $data
     */
    public function handle(array $data): User
    {
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'country_id' => $data['country_id'],
            'locale' => $data['locale'] ?? config('app.locale'),
            'role' => UserRole::Viewer,
        ]);

        $user->sendEmailVerificationNotification();

        return $user;
    }
}
