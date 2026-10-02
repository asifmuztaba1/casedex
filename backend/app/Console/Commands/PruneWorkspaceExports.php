<?php

namespace App\Console\Commands;

use App\Domain\Tenancy\Models\WorkspaceExport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneWorkspaceExports extends Command
{
    protected $signature = 'workspace:prune-exports';

    protected $description = 'Delete export files whose download link has expired';

    public function handle(): int
    {
        $disk = Storage::disk(config('filesystems.default'));
        $pruned = 0;

        WorkspaceExport::query()->withoutGlobalScopes()
            ->where('status', WorkspaceExport::STATUS_READY)
            ->where('expires_at', '<=', now())
            ->each(function (WorkspaceExport $export) use ($disk, &$pruned): void {
                if ($export->path !== null) {
                    $disk->delete($export->path);
                }
                $export->forceFill(['status' => WorkspaceExport::STATUS_EXPIRED, 'path' => null])->save();
                $pruned++;
            });

        $this->info("Pruned {$pruned} expired export(s).");

        return self::SUCCESS;
    }
}
