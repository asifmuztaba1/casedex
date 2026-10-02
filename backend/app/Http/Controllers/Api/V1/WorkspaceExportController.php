<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Tenancy\Actions\RequestWorkspaceExportAction;
use App\Domain\Tenancy\Models\WorkspaceExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\WorkspaceExportResource;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Full exports of a workspace (cases, contacts, documents) for admins.
 */
class WorkspaceExportController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('manage-workspace');

        $exports = WorkspaceExport::query()
            ->with('requester')
            ->latest()
            ->limit(5)
            ->get();

        return WorkspaceExportResource::collection($exports);
    }

    public function store(Request $request, RequestWorkspaceExportAction $requestExport): JsonResponse
    {
        Gate::authorize('manage-workspace');

        $user = $request->user();
        $export = $requestExport->handle($user->tenant, $user);

        return (new WorkspaceExportResource($export->load('requester')))->response()->setStatusCode(202);
    }

    /**
     * Signed link from the "export ready" email. Works without signing in, so
     * the last member of a workspace being deleted can still download it.
     */
    public function download(string $publicId, RecordAuditLogAction $auditLog): StreamedResponse
    {
        $export = WorkspaceExport::query()->withoutGlobalScopes()
            ->where('public_id', $publicId)
            ->firstOrFail();

        abort_unless($export->isDownloadable(), 410, __('messages.export_unavailable'));

        $disk = Storage::disk(config('filesystems.default'));
        abort_unless($disk->exists($export->path), 410, __('messages.export_unavailable'));

        TenantContext::set($export->tenant_id);
        try {
            $auditLog->handle('workspace.export_downloaded', $export->requester, WorkspaceExport::class, $export->public_id);
        } finally {
            TenantContext::clear();
        }

        return $disk->download($export->path, 'casedex-export-'.$export->created_at?->format('Y-m-d').'.zip');
    }
}
