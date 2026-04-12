<?php

namespace App\Console\Commands;

use App\Domain\Judiciary\Actions\SeedJudiciaryCourtsAction;
use Illuminate\Console\Command;
use Throwable;

class SeedJudiciaryCourts extends Command
{
    protected $signature = 'judiciary:seed-courts';

    protected $description = 'Seed all Bangladesh judiciary portal courts (divisions, districts, types, courts).';

    public function handle(SeedJudiciaryCourtsAction $action): int
    {
        $this->info('Seeding judiciary courts from causelist.judiciary.gov.bd ...');

        try {
            $result = $action->handle(function (string $message): void {
                $this->line('  '.$message);
            });
        } catch (Throwable $e) {
            $this->error('Seeding failed: '.$e->getMessage());

            return Command::FAILURE;
        }

        $this->info(sprintf(
            'Seeded: %d divisions, %d districts, %d court types, %d courts (skipped %d).',
            $result['divisions'],
            $result['districts'],
            $result['court_types'],
            $result['courts'],
            $result['skipped'],
        ));

        return Command::SUCCESS;
    }
}
