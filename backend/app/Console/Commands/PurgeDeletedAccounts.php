<?php

namespace App\Console\Commands;

use App\Domain\Auth\Actions\PurgeUserAccountAction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class PurgeDeletedAccounts extends Command
{
    protected $signature = 'accounts:purge-deleted';

    protected $description = 'Erase accounts whose 30-day deletion grace period has ended';

    public function handle(PurgeUserAccountAction $purge): int
    {
        $purged = 0;
        $failed = 0;

        User::query()
            ->whereNotNull('deletion_requested_at')
            ->whereNull('anonymised_at')
            ->where('deletion_scheduled_for', '<=', now())
            ->orderBy('deletion_scheduled_for')
            ->each(function (User $user) use ($purge, &$purged, &$failed): void {
                try {
                    $purge->handle($user);
                    $purged++;
                } catch (Throwable $e) {
                    // One failure must not stop the others; it is retried tomorrow.
                    $failed++;
                    Log::error('account.purge_failed', ['tenant_id' => $user->tenant_id, 'user_id' => $user->id, 'error' => $e->getMessage()]);
                }
            });

        $this->info("Erased {$purged} account(s), {$failed} failed.");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
