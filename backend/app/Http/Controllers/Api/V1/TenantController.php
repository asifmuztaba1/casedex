<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Tenancy\Actions\CreateTenantForUserAction;
use App\Domain\Tenancy\Actions\UpdateTenantAction;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreTenantRequest;
use App\Http\Requests\Api\V1\UpdateTenantRequest;
use App\Http\Resources\Api\V1\UserResource;

class TenantController extends Controller
{
    public function store(
        StoreTenantRequest $request,
        CreateTenantForUserAction $createTenant,
        RecordAuditLogAction $auditLog
    ) {
        $user = $request->user();

        $payload = $request->validated();

        $user = $createTenant->handle(
            $user,
            $payload['tenant_name'],
            (int) $payload['country_id'],
            TenantPlan::from((string) $payload['plan']),
            $payload['locale'] ?? null
        );

        $auditLog->handle('tenant.create', $user, Tenant::class, $user->tenant?->public_id);

        return new UserResource($user->refresh());
    }

    public function update(
        UpdateTenantRequest $request,
        UpdateTenantAction $updateTenant,
        RecordAuditLogAction $auditLog
    ) {
        $user = $request->user();
        $tenant = $user->tenant;

        $updateTenant->handle($tenant, $request->validated()['name']);

        $auditLog->handle('tenant.update', $user, Tenant::class, $tenant->public_id);

        return new UserResource($user->refresh());
    }
}
