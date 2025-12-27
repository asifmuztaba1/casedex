<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Tenancy\Actions\CreateTenantForUserAction;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreTenantRequest;
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
            $payload['locale'] ?? null
        );

        $auditLog->handle('tenant.create', $user, Tenant::class, $user->tenant?->public_id);

        return new UserResource($user->refresh());
    }
}
