<?php

namespace App\Console\Commands;

use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Console\Command;

class GrantMonthlyAiCredits extends Command
{
    protected $signature = 'ai:grant-monthly-credits';

    protected $description = 'Grant monthly free AI credits and expire unused free credits.';

    public function handle(AiCreditService $creditService): int
    {
        Tenant::query()->chunkById(100, function ($tenants) use ($creditService): void {
            foreach ($tenants as $tenant) {
                $creditService->grantMonthlyIfDue($tenant);
            }
        });

        $this->info('Monthly AI credit grant completed.');

        return self::SUCCESS;
    }
}
