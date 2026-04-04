<?php

namespace App\Domain\Tenancy\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateTenantForUserAction
{
    public function handle(User $user, string $tenantName, int $countryId, TenantPlan $plan, ?string $locale = null): User
    {
        if (in_array($user->role?->value, UserRole::platformRoles(), true)) {
            abort(403, __('messages.platform_user_cannot_create_tenant'));
        }

        if ($user->tenant_id !== null) {
            abort(409, __('messages.user_already_has_tenant'));
        }

        return DB::transaction(function () use ($user, $tenantName, $countryId, $plan, $locale): User {
            $tenant = Tenant::query()->create([
                'name' => $tenantName,
                'plan' => $plan,
                'trial_ends_at' => now()->addDays((int) config('billing.trial_days', 30)),
                'country_id' => $countryId,
                'locale' => $locale ?? $user->locale ?? config('app.locale'),
            ]);

            $tenant->createAsCustomer([
                'trial_ends_at' => $tenant->trial_ends_at,
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
