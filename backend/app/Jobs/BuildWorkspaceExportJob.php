<?php

namespace App\Jobs;

use App\Domain\Tenancy\Actions\BuildWorkspaceExportAction;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Mail\WorkspaceExportReadyMail;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Throwable;

/**
 * Builds a workspace export zip and emails the requester a signed link.
 * Idempotent: an export that is no longer pending is left alone.
 */
class BuildWorkspaceExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 900;

    public function __construct(
        public readonly int $tenantId,
        public readonly int $exportId
    ) {
    }

    public function handle(BuildWorkspaceExportAction $build): void
    {
        TenantContext::set($this->tenantId);

        try {
            $export = WorkspaceExport::query()->with('requester')->find($this->exportId);
            if ($export === null || $export->status !== WorkspaceExport::STATUS_PENDING) {
                return;
            }

            ['path' => $path, 'size' => $size] = $build->handle($export);

            $export->forceFill([
                'status' => WorkspaceExport::STATUS_READY,
                'path' => $path,
                'size_bytes' => $size,
                'completed_at' => now(),
            ])->save();

            Log::info('workspace.export_ready', [
                'tenant_id' => $this->tenantId,
                'export_id' => $export->id,
                'reason' => $export->reason,
                'size_bytes' => $size,
            ]);

            if ($export->requester !== null) {
                Mail::to($export->requester->email)->send(new WorkspaceExportReadyMail(
                    $export->requester,
                    (string) Tenant::query()->whereKey($this->tenantId)->value('name'),
                    rtrim((string) config('app.url'), '/').self::downloadPath($export),
                    $export->expires_at,
                ));
            }
        } finally {
            TenantContext::clear();
        }
    }

    public function failed(?Throwable $exception): void
    {
        WorkspaceExport::query()->withoutGlobalScopes()->whereKey($this->exportId)
            ->where('status', WorkspaceExport::STATUS_PENDING)
            ->update(['status' => WorkspaceExport::STATUS_FAILED]);

        Log::error('workspace.export_failed', [
            'tenant_id' => $this->tenantId,
            'export_id' => $this->exportId,
            'error' => $exception?->getMessage(),
        ]);
    }

    /**
     * Signed path that works without signing in, until the export expires.
     * The signature covers the path only, so it survives proxies that
     * change the host (as document downloads do).
     */
    public static function downloadPath(WorkspaceExport $export): string
    {
        return URL::temporarySignedRoute(
            'api.v1.workspace-exports.download',
            $export->expires_at ?? now()->addDays(7),
            ['publicId' => $export->public_id],
            absolute: false
        );
    }
}
