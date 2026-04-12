<?php

namespace Database\Seeders;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Seeder;
use Normalizer;
use RuntimeException;

/**
 * Production-safe seeder that ingests the static judiciary portal dump
 * produced by `php artisan judiciary:export-portal-dump` on a developer
 * workstation. No network calls — reads the JSON file that ships in the
 * repo and upserts divisions, districts, court types, and courts.
 *
 * Idempotent. Safe to re-run after each deploy.
 */
class JudiciaryPortalCourtsSeeder extends Seeder
{
    private const DEFAULT_PATH = 'database/seeders/data/judiciary_portal_courts.json';

    public function run(): void
    {
        $path = base_path(self::DEFAULT_PATH);

        if (! is_file($path)) {
            $this->command?->warn("Judiciary portal dump not found at {$path}. Skipping.");

            return;
        }

        $payload = json_decode((string) file_get_contents($path), true);
        if (! is_array($payload) || ! isset($payload['rows']) || ! is_array($payload['rows'])) {
            throw new RuntimeException("judiciary_portal_courts.json is malformed at {$path}");
        }

        $countryCode = (string) ($payload['rows'][0]['country_code'] ?? 'BD');
        $country = Country::query()->where('code', $countryCode)->firstOrFail();
        $countryId = $country->id;

        $divisionsByKey = [];
        $districtsByKey = [];
        $courtTypesByKey = [];

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($payload['rows'] as $row) {
            $divisionKey = $this->normalizeKey($row['division_name_bn'] ?? '');
            $division = $divisionsByKey[$divisionKey] ?? null;
            if (! $division) {
                $division = $this->resolveDivision($countryId, $row);
                $divisionsByKey[$divisionKey] = $division;
            }

            $districtKey = $division->id.'|'.$this->normalizeKey($row['district_name_bn'] ?? '');
            $district = $districtsByKey[$districtKey] ?? null;
            if (! $district) {
                $district = $this->resolveDistrict($countryId, $division, $row);
                $districtsByKey[$districtKey] = $district;
            }

            $typeKey = strtolower((string) ($row['court_type_name'] ?? ''));
            $courtType = $courtTypesByKey[$typeKey] ?? null;
            if (! $courtType) {
                $courtType = $this->resolveCourtType($countryId, $row);
                $courtTypesByKey[$typeKey] = $courtType;
            }

            $result = $this->upsertCourt(
                $countryId,
                $division->id,
                $district->id,
                $courtType->id,
                $row
            );

            if ($result === 'created') {
                $created++;
            } elseif ($result === 'updated') {
                $updated++;
            } else {
                $skipped++;
            }
        }

        $this->command?->info(
            "Judiciary portal courts seeded: created={$created}, updated={$updated}, skipped={$skipped}, total=".count($payload['rows'])
        );
    }

    private function resolveDivision(int $countryId, array $row): CourtDivision
    {
        $nameBn = $this->normalizeBn($row['division_name_bn'] ?? '');
        $name = (string) ($row['division_name'] ?? '');

        $existing = CourtDivision::query()
            ->where('country_id', $countryId)
            ->where(function ($q) use ($name, $nameBn): void {
                $q->whereRaw('LOWER(name) = ?', [strtolower($name)])
                    ->orWhere('name_bn', $nameBn);
            })
            ->first();

        if ($existing) {
            return $existing;
        }

        return CourtDivision::query()->create([
            'country_id' => $countryId,
            'name' => $name,
            'name_bn' => $nameBn,
        ]);
    }

    private function resolveDistrict(int $countryId, CourtDivision $division, array $row): CourtDistrict
    {
        $nameBn = $this->normalizeBn($row['district_name_bn'] ?? '');
        $name = (string) ($row['district_name'] ?? '');

        $existing = CourtDistrict::query()
            ->where('country_id', $countryId)
            ->where('division_id', $division->id)
            ->where(function ($q) use ($name, $nameBn): void {
                $q->whereRaw('LOWER(name) = ?', [strtolower($name)])
                    ->orWhere('name_bn', $nameBn);
            })
            ->first();

        if ($existing) {
            return $existing;
        }

        return CourtDistrict::query()->create([
            'country_id' => $countryId,
            'division_id' => $division->id,
            'name' => $name,
            'name_bn' => $nameBn,
        ]);
    }

    private function resolveCourtType(int $countryId, array $row): CourtType
    {
        $name = (string) ($row['court_type_name'] ?? '');
        $nameBn = $this->normalizeBn($row['court_type_name_bn'] ?? '');

        $existing = CourtType::query()
            ->where('country_id', $countryId)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->first();

        if ($existing) {
            return $existing;
        }

        return CourtType::query()->create([
            'country_id' => $countryId,
            'name' => $name,
            'name_bn' => $nameBn,
        ]);
    }

    /**
     * @return 'created'|'updated'|'skipped'
     */
    private function upsertCourt(
        int $countryId,
        int $divisionId,
        int $districtId,
        int $courtTypeId,
        array $row,
    ): string {
        $portalId = (int) ($row['portal_court_id'] ?? 0);
        $originId = (int) ($row['portal_origin_id'] ?? 0);
        $name = (string) ($row['name'] ?? '');
        $nameBn = $this->normalizeBn((string) ($row['name_bn'] ?? ''));

        if ($portalId === 0 || $name === '' || $nameBn === '') {
            return 'skipped';
        }

        $court = Court::query()->where('judiciary_portal_court_id', $portalId)->first()
            ?? Court::query()
                ->where('district_id', $districtId)
                ->where('court_type_id', $courtTypeId)
                ->where('name', $name)
                ->first();

        if ($court) {
            $court->forceFill([
                'country_id' => $countryId,
                'division_id' => $divisionId,
                'district_id' => $districtId,
                'court_type_id' => $courtTypeId,
                'judiciary_portal_court_id' => $portalId,
                'judiciary_portal_origin_id' => $originId,
                'name' => $name,
                'name_bn' => $nameBn,
                'is_active' => true,
            ])->save();

            return 'updated';
        }

        Court::query()->create([
            'country_id' => $countryId,
            'division_id' => $divisionId,
            'district_id' => $districtId,
            'court_type_id' => $courtTypeId,
            'judiciary_portal_court_id' => $portalId,
            'judiciary_portal_origin_id' => $originId,
            'name' => $name,
            'name_bn' => $nameBn,
            'is_active' => true,
        ]);

        return 'created';
    }

    private function normalizeBn(?string $value): string
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return '';
        }
        $nfc = Normalizer::normalize($trimmed, Normalizer::FORM_C);

        return $nfc === false ? $trimmed : $nfc;
    }

    private function normalizeKey(?string $value): string
    {
        return strtolower($this->normalizeBn($value));
    }
}
