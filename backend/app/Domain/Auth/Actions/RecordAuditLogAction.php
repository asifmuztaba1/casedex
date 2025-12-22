<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\AuditLog;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;

class RecordAuditLogAction
{
    public function handle(
        string $action,
        ?Authenticatable $user,
        ?string $targetType = null,
        ?string $targetId = null,
        array $metadata = []
    ): void {
        $tenantId = null;
        $didSetContext = false;

        try {
            $tenantId = TenantContext::id();
        } catch (\RuntimeException) {
            $tenantId = $user?->tenant_id;
        }

        if ($tenantId === null) {
            return;
        }

        try {
            try {
                TenantContext::id();
            } catch (\RuntimeException) {
                TenantContext::set($tenantId);
                $didSetContext = true;
            }

            AuditLog::create([
                'tenant_id' => $tenantId,
                'user_id' => $user?->getAuthIdentifier(),
                'action' => $action,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'metadata' => $metadata,
                'created_at' => now(),
            ]);
        } finally {
            if ($didSetContext) {
                TenantContext::clear();
            }
        }
    }
}
