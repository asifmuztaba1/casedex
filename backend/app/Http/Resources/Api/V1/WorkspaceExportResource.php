<?php

namespace App\Http\Resources\Api\V1;

use App\Jobs\BuildWorkspaceExportJob;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domain\Tenancy\Models\WorkspaceExport */
class WorkspaceExportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            // pending | ready | failed | expired
            'status' => $this->status,
            'reason' => $this->reason,
            'size_bytes' => $this->size_bytes,
            'requested_by' => $this->requester?->name,
            'created_at' => $this->created_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'download_url' => $this->isDownloadable() ? BuildWorkspaceExportJob::downloadPath($this->resource) : null,
        ];
    }
}
