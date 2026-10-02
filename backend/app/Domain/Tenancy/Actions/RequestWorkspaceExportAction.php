<?php

namespace App\Domain\Tenancy\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Jobs\BuildWorkspaceExportJob;
use App\Models\User;
use Carbon\CarbonInterface;

/**
 * Queues a workspace export. While one is still being built, asking again
 * returns that one instead of starting another.
 */
class RequestWorkspaceExportAction
{
    /** How long a manual export link stays valid. */
    public const MANUAL_TTL_DAYS = 7;

    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(
        Tenant $tenant,
        User $requester,
        string $reason = WorkspaceExport::REASON_MANUAL,
        ?CarbonInterface $expiresAt = null
    ): WorkspaceExport {
        $pending = WorkspaceExport::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', WorkspaceExport::STATUS_PENDING)
            ->first();
        if ($pending !== null) {
            return $pending;
        }

        $export = WorkspaceExport::query()->withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'requested_by' => $requester->id,
            'status' => WorkspaceExport::STATUS_PENDING,
            'reason' => $reason,
            'expires_at' => $expiresAt ?? now()->addDays(self::MANUAL_TTL_DAYS),
        ]);

        $this->auditLog->handle('workspace.export_requested', $requester, WorkspaceExport::class, $export->public_id, [
            'reason' => $reason,
        ]);

        BuildWorkspaceExportJob::dispatch($tenant->id, $export->id)->afterCommit();

        return $export;
    }
}
