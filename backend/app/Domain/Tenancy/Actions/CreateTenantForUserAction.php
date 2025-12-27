<?php

namespace App\Domain\Tenancy\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateTenantForUserAction
{
    public function handle(User $user, string $tenantName, int $countryId, ?string $locale = null): User
    {
        if ($user->tenant_id !== null) {
            abort(409, __('messages.user_already_has_tenant'));
        }

        return DB::transaction(function () use ($user, $tenantName, $countryId, $locale): User {
            $tenant = Tenant::query()->create([
                'name' => $tenantName,
                'plan' => TenantPlan::Free,
                'country_id' => $countryId,
                'locale' => $locale ?? $user->locale ?? config('app.locale'),
            ]);

            $user->tenant_id = $tenant->id;
            $user->role = UserRole::Admin;
            $user->country_id = $countryId;
            $user->locale = $user->locale ?? $tenant->locale ?? config('app.locale');
            $user->save();

            return $user;
        });
    }
}
