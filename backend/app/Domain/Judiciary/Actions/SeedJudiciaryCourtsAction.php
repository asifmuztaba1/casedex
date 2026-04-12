<?php

namespace App\Domain\Judiciary\Actions;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Judiciary\CourtOriginCatalog;
use App\Domain\Tenancy\Models\Country;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Normalizer;
use RuntimeException;

class SeedJudiciaryCourtsAction
{
    private const API_BASE = 'https://causelist.judiciary.gov.bd/api';

    private const USER_AGENT = 'CaseDex/1.0 (+contact@casedex.app)';

    /**
     * Portal division name (English) → our seeder name (English).
     */
    private const DIVISION_ALIASES = [
        'Barisal' => 'Barishal',
        'Chittagong' => 'Chattogram',
    ];

    /**
     * Portal district name (uppercase) → our seeder name (Title case).
     * Keys must be compared against strtoupper() of the portal name.
     */
    private const DISTRICT_ALIASES = [
        'BARISAL' => 'Barishal',
        'BORGUNA' => 'Barguna',
        'COMILLA' => 'Comilla',
        'COXS BAZAR' => "Cox's Bazar",
        "COX'S BAZAR" => "Cox's Bazar",
        'CHITTAGONG' => 'Chattogram',
        'CHATTOGRAM' => 'Chattogram',
        'MAULVIBAZAR' => 'Moulvibazar',
        'NETRAKONA' => 'Netrokona',
        'CHAPAI NABABGANJ' => 'Chapainawabganj',
        'CHAPAINAWABGANJ' => 'Chapainawabganj',
        'KHAGRACHARI' => 'Khagrachhari',
        'RANGAMATI' => 'Rangamati',
        'BANDARBAN' => 'Bandarban',
        'JHENAIDAH' => 'Jhenaidah',
        'CHUADANGA' => 'Chuadanga',
    ];

    /**
     * @return array{divisions:int, districts:int, court_types:int, courts:int, skipped:int}
     */
    public function handle(callable $onProgress = null): array
    {
        $country = Country::query()->where('code', 'BD')->firstOrFail();
        $countryId = $country->id;

        $this->log($onProgress, 'Fetching portal geo hierarchy...');
        $portalDivs = $this->fetchJson('geo/divisions');

        // Step 1: resolve divisions (portal id → local CourtDivision)
        $divisionByPortalId = $this->resolveDivisions($portalDivs, $countryId);
        $this->log($onProgress, 'Resolved '.count($divisionByPortalId).' divisions.');

        // Step 2: resolve districts (portal id → local CourtDistrict)
        $districtByPortalId = $this->resolveDistricts($portalDivs, $divisionByPortalId, $countryId);
        $this->log($onProgress, 'Resolved '.count($districtByPortalId).' districts.');

        // Step 3: ensure all court types (from CourtOriginCatalog) exist
        $courtTypeByOrigin = $this->ensureCourtTypes($countryId);
        $this->log($onProgress, 'Resolved '.count($courtTypeByOrigin).' court types.');

        // Step 4: walk portal courts (district × origin) and upsert
        $courtCount = 0;
        $skipped = 0;
        $districtCount = count($districtByPortalId);
        $i = 0;

        foreach ($districtByPortalId as $portalDistrictId => $district) {
            $i++;
            foreach (CourtOriginCatalog::ids() as $originId) {
                $response = $this->fetchJson('courts', [
                    'district_id' => $portalDistrictId,
                    'office_origin_id' => $originId,
                ]);

                if (! is_array($response)) {
                    continue;
                }

                foreach ($response as $portalCourt) {
                    $typeId = $courtTypeByOrigin[$originId] ?? null;
                    if ($typeId === null) {
                        $skipped++;

                        continue;
                    }

                    $divisionId = $district->division_id;
                    $this->upsertCourt(
                        $countryId,
                        $divisionId,
                        $district->id,
                        $typeId,
                        $portalCourt
                    );
                    $courtCount++;
                }

                usleep(80000); // 80ms throttle between requests
            }

            if ($i % 5 === 0 || $i === $districtCount) {
                $this->log(
                    $onProgress,
                    "Progress: {$i}/{$districtCount} districts, {$courtCount} courts upserted"
                );
            }
        }

        return [
            'divisions' => count($divisionByPortalId),
            'districts' => count($districtByPortalId),
            'court_types' => count($courtTypeByOrigin),
            'courts' => $courtCount,
            'skipped' => $skipped,
        ];
    }

    /**
     * @return array<int, CourtDivision>
     */
    private function resolveDivisions(array $portalDivs, int $countryId): array
    {
        $existing = CourtDivision::query()->where('country_id', $countryId)->get();
        $byEn = $existing->keyBy(fn ($d) => strtolower($d->name));
        $byBn = $existing->keyBy(fn ($d) => $this->normalizeBn($d->name_bn));

        $result = [];
        foreach ($portalDivs as $div) {
            $portalName = $div['division_name_eng'];
            $localName = self::DIVISION_ALIASES[$portalName] ?? $portalName;
            $bn = $this->normalizeBn($div['division_name_bng']);

            $match = $byEn->get(strtolower($localName)) ?? $byBn->get($bn);

            if ($match) {
                $result[$div['geo_division_id']] = $match;

                continue;
            }

            $created = CourtDivision::query()->create([
                'country_id' => $countryId,
                'name' => $localName,
                'name_bn' => $bn,
            ]);
            $result[$div['geo_division_id']] = $created;
            $byEn->put(strtolower($localName), $created);
            $byBn->put($bn, $created);
        }

        return $result;
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

    /**
     * @param  array<int, CourtDivision>  $divisionByPortalId
     * @return array<int, CourtDistrict>
     */
    private function resolveDistricts(array $portalDivs, array $divisionByPortalId, int $countryId): array
    {
        $existing = CourtDistrict::query()->where('country_id', $countryId)->get();
        $byEn = $existing->keyBy(fn ($d) => strtolower($d->name));
        // Dedup against bangla within division scope (schema has unique(division_id, name_bn)).
        $byDivBn = $existing->keyBy(fn ($d) => $d->division_id.'|'.$this->normalizeBn($d->name_bn));

        $result = [];

        foreach ($portalDivs as $div) {
            $division = $divisionByPortalId[$div['geo_division_id']] ?? null;
            if (! $division) {
                continue;
            }

            foreach ($div['districts'] as $d) {
                $portalName = $d['district_name_eng'];
                $normalized = strtoupper(trim($portalName));
                $localName = self::DISTRICT_ALIASES[$normalized]
                    ?? ucwords(strtolower($portalName));
                $bn = $this->normalizeBn($d['district_name_bng']);

                $match = $byEn->get(strtolower($localName))
                    ?? $byDivBn->get($division->id.'|'.$bn);

                if ($match) {
                    $result[$d['geo_district_id']] = $match;

                    continue;
                }

                $created = CourtDistrict::query()->create([
                    'country_id' => $countryId,
                    'division_id' => $division->id,
                    'name' => $localName,
                    'name_bn' => $bn,
                ]);
                $result[$d['geo_district_id']] = $created;
                $byEn->put(strtolower($localName), $created);
                $byDivBn->put($division->id.'|'.$bn, $created);
            }
        }

        return $result;
    }

    /**
     * @return array<int, int> origin_id → court_type_id
     */
    private function ensureCourtTypes(int $countryId): array
    {
        $result = [];
        $existing = CourtType::query()
            ->where('country_id', $countryId)
            ->get()
            ->keyBy(fn ($t) => strtolower($t->name));

        foreach (CourtOriginCatalog::ORIGINS as $originId => $meta) {
            $key = strtolower($meta['en']);
            if ($existing->has($key)) {
                $result[$originId] = $existing->get($key)->id;

                continue;
            }

            $created = CourtType::query()->create([
                'country_id' => $countryId,
                'name' => $meta['en'],
                'name_bn' => $meta['bn'],
            ]);
            $result[$originId] = $created->id;
            $existing->put($key, $created);
        }

        return $result;
    }

    private function upsertCourt(
        int $countryId,
        int $divisionId,
        int $districtId,
        int $courtTypeId,
        array $portalCourt,
    ): void {
        $portalId = (int) $portalCourt['id'];
        $name = $portalCourt['office_name_eng'] ?? null;
        $nameBn = $portalCourt['office_name_bng'] ?? null;

        if (! $name || ! $nameBn) {
            return;
        }

        $nameBn = $this->normalizeBn(preg_replace('/\s+/u', ' ', $nameBn) ?? $nameBn);
        $originId = (int) ($portalCourt['office_origin_id'] ?? 0);

        // Prefer match on portal id; fall back to the legacy seeder's natural key
        // (district_id, court_type_id, name) so the 630 pre-seeded courts attach
        // their portal id instead of colliding on the unique index.
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

            return;
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
    }

    private function fetchJson(string $path, array $query = []): mixed
    {
        $response = Http::withHeaders([
            'User-Agent' => self::USER_AGENT,
            'Accept' => 'application/json, text/plain, */*',
        ])
            ->timeout(20)
            ->retry(2, 1000)
            ->get(self::API_BASE, array_merge(['path' => $path], $query));

        if (! $response->successful()) {
            throw new RuntimeException(
                "judiciary.api.fetch_failed path={$path} status={$response->status()}"
            );
        }

        $decoded = json_decode($response->body(), true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('judiciary.api.invalid_json', ['path' => $path, 'error' => json_last_error_msg()]);

            return null;
        }

        return $decoded;
    }

    private function log(?callable $onProgress, string $message): void
    {
        if ($onProgress !== null) {
            $onProgress($message);
        }
    }
}
