<?php

namespace App\Domain\Tenancy\Actions;

use App\Domain\Tenancy\Models\Tenant;

class UpdateTenantAction
{
    public function handle(Tenant $tenant, string $name): Tenant
    {
        $tenant->update(['name' => $name]);

        return $tenant->refresh();
    }
}
