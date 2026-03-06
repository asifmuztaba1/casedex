<?php

namespace App\Console\Commands;

use App\Domain\Ai\Models\AiCreditPack;
use Illuminate\Console\Command;

class SyncAiCreditPacks extends Command
{
    protected $signature = 'ai:sync-credit-packs';

    protected $description = 'Sync AI credit packs from billing.ai.packs config.';

    public function handle(): int
    {
        foreach (config('billing.ai.packs', []) as $code => $packConfig) {
            AiCreditPack::query()->updateOrCreate(
                ['code' => (string) $code],
                [
                    'name' => (string) ($packConfig['name'] ?? ucfirst((string) $code).' AI Pack'),
                    'credits' => (int) ($packConfig['credits'] ?? 0),
                    'price_usd_cents' => (int) ($packConfig['price_usd_cents'] ?? 0),
                    'price_bdt' => (float) ($packConfig['price_bdt'] ?? 0),
                    'lemon_variant_id' => $packConfig['lemon_variant_id'] ?? null,
                    'active' => true,
                    'sort_order' => (int) ($packConfig['sort_order'] ?? 0),
                ]
            );
        }

        $this->info('AI credit packs synced.');

        return self::SUCCESS;
    }
}
