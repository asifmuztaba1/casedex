<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Read-only check that no tenant-owned row points at a row owned by a
 * different tenant (for example a case whose client belongs to another
 * firm). Exits non-zero when it finds any, so it can run in CI or cron.
 */
class AuditCrossTenantLinks extends Command
{
    protected $signature = 'tenancy:audit-cross-tenant-links {--limit=20 : Max example ids to print per link}';

    protected $description = 'Report rows that reference a record owned by another tenant (read-only).';

    /**
     * child table, foreign key column, parent table, parent tenant column
     *
     * @var array<int, array{0: string, 1: string, 2: string, 3: string}>
     */
    private const LINKS = [
        ['cases', 'client_id', 'clients', 'tenant_id'],
        ['case_parties', 'case_id', 'cases', 'tenant_id'],
        ['case_parties', 'client_id', 'clients', 'tenant_id'],
        ['case_participants', 'case_id', 'cases', 'tenant_id'],
        ['case_participants', 'user_id', 'users', 'tenant_id'],
        ['hearings', 'case_id', 'cases', 'tenant_id'],
        ['diary_entries', 'case_id', 'cases', 'tenant_id'],
        ['diary_entries', 'hearing_id', 'hearings', 'tenant_id'],
        ['documents', 'case_id', 'cases', 'tenant_id'],
        ['documents', 'hearing_id', 'hearings', 'tenant_id'],
    ];

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $rows = [];
        $total = 0;

        foreach (self::LINKS as [$child, $column, $parent, $parentTenant]) {
            $query = DB::table("{$child} as c")
                ->join("{$parent} as p", 'p.id', '=', "c.{$column}")
                ->whereNotNull("c.{$column}")
                ->whereColumn('c.tenant_id', '!=', "p.{$parentTenant}");

            $count = (clone $query)->count();
            $total += $count;
            $examples = $count > 0
                ? (clone $query)->orderBy('c.id')->limit($limit)->pluck('c.id')->implode(', ')
                : '';

            $rows[] = ["{$child}.{$column} -> {$parent}", $count, $examples];
        }

        $this->table(['Link', 'Cross-tenant rows', 'Example row ids'], $rows);

        if ($total > 0) {
            $this->error("Found {$total} cross-tenant reference(s). Review and repair them before relying on tenant isolation.");

            return self::FAILURE;
        }

        $this->info('No cross-tenant references found.');

        return self::SUCCESS;
    }
}
