<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Notifications\Actions\SendTeamMemberInviteMailAction;
use App\Models\User;

class CreateUserAction
{
    public function __construct(
        private readonly SendTeamMemberInviteMailAction $sendInvite
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function handle(User $actor, array $data): User
    {
        $tenantLocale = $actor->tenant?->locale;

        $user = User::query()->create([
            'tenant_id' => $actor->tenant_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'country_id' => $data['country_id'],
            'locale' => $data['locale'] ?? $tenantLocale ?? config('app.locale'),
        ]);

        $this->sendInvite->handle($user, (string) $data['password']);
        $user->sendEmailVerificationNotification();

        return $user;
    }
}
