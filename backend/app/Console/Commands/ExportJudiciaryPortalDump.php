<?php

namespace App\Console\Commands;

use App\Domain\Courts\Models\Court;
use Illuminate\Console\Command;

class ExportJudiciaryPortalDump extends Command
{
    protected $signature = 'judiciary:export-portal-dump
        {--path=database/seeders/data/judiciary_portal_courts.json : Output path relative to base_path()}';

    protected $description = 'Export every court with a judiciary portal id to a static JSON dump consumable by JudiciaryPortalCourtsSeeder in production.';

    public function handle(): int
    {
        $path = base_path((string) $this->option('path'));
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $courts = Court::query()
            ->whereNotNull('judiciary_portal_court_id')
            ->with(['country:id,code', 'division:id,name,name_bn', 'district:id,name,name_bn', 'type:id,name,name_bn'])
            ->orderBy('judiciary_portal_court_id')
            ->get();

        if ($courts->isEmpty()) {
            $this->error('No courts with judiciary_portal_court_id found. Run judiciary:seed-courts first.');

            return self::FAILURE;
        }

        $rows = $courts->map(function (Court $court): array {
            return [
                'portal_court_id' => (int) $court->judiciary_portal_court_id,
                'portal_origin_id' => (int) $court->judiciary_portal_origin_id,
                'country_code' => $court->country?->code,
                'division_name' => $court->division?->name,
                'division_name_bn' => $court->division?->name_bn,
                'district_name' => $court->district?->name,
                'district_name_bn' => $court->district?->name_bn,
                'court_type_name' => $court->type?->name,
                'court_type_name_bn' => $court->type?->name_bn,
                'name' => $court->name,
                'name_bn' => $court->name_bn,
            ];
        })->values()->all();

        $payload = [
            'generated_at' => now()->toIso8601String(),
            'count' => count($rows),
            'rows' => $rows,
        ];

        file_put_contents(
            $path,
            json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n"
        );

        $this->info("Exported {$payload['count']} courts to {$path}");

        return self::SUCCESS;
    }
}
