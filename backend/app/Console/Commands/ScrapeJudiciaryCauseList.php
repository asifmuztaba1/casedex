<?php

namespace App\Console\Commands;

use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Cases\Models\CaseFile;
use App\Jobs\ScrapeJudiciaryCauseListJob;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ScrapeJudiciaryCauseList extends Command
{
    protected $signature = 'judiciary:scrape-causelist
                            {--date= : Cause list date (YYYY-MM-DD). Defaults to today.}
                            {--tenant= : Limit to a single tenant id.}
                            {--court= : Limit to a single court id.}';

    protected $description = 'Dispatch per-(tenant, court) jobs to scrape tomorrow\'s cause list.';

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))->startOfDay()
            : Carbon::today('Asia/Dhaka');

        $this->info("Scraping cause lists for {$date->toDateString()}");

        // Find distinct (tenant_id, court_id) pairs that have cases with registry info.
        $query = DB::table('cases')
            ->join('courts', 'cases.court_id', '=', 'courts.id')
            ->whereNotNull('cases.registry_case_type_bn')
            ->whereNotNull('cases.registry_case_serial')
            ->whereNotNull('cases.registry_case_year')
            ->whereNotNull('courts.judiciary_portal_court_id')
            ->whereIn('cases.status', [CaseStatus::Open->value, CaseStatus::Active->value])
            ->whereNull('cases.deleted_at')
            ->select('cases.tenant_id', 'cases.court_id')
            ->distinct();

        if ($this->option('tenant')) {
            $query->where('cases.tenant_id', (int) $this->option('tenant'));
        }

        if ($this->option('court')) {
            $query->where('cases.court_id', (int) $this->option('court'));
        }

        $pairs = $query->get();

        if ($pairs->isEmpty()) {
            $this->warn('No (tenant, court) pairs with registry-linked cases found. Nothing to scrape.');

            return Command::SUCCESS;
        }

        $dateYmd = $date->toDateString();
        $dispatched = 0;

        foreach ($pairs as $pair) {
            ScrapeJudiciaryCauseListJob::dispatch(
                (int) $pair->tenant_id,
                (int) $pair->court_id,
                $dateYmd,
            );
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} scrape jobs.");

        return Command::SUCCESS;
    }
}
