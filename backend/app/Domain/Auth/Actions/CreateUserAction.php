<?php

namespace App\Domain\Auth\Actions;

use App\Models\User;

class CreateUserAction
{
    /**
     * @param array<string, mixed> $data
     */
    public function handle(User $actor, array $data): User
    {
        $tenantLocale = $actor->tenant?->locale;

        return User::query()->create([
            'tenant_id' => $actor->tenant_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'country_id' => $data['country_id'],
            'locale' => $data['locale'] ?? $tenantLocale ?? config('app.locale'),
        ]);
    }
}
