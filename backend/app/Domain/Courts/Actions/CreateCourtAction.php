<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtType;

class CreateCourtAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Court
    {
        $district = CourtDistrict::query()
            ->where('public_id', $data['district_public_id'])
            ->firstOrFail();

        $type = CourtType::query()
            ->where('public_id', $data['court_type_public_id'])
            ->firstOrFail();

        return Court::create([
            'country_id' => $district->country_id,
            'division_id' => $district->division_id,
            'district_id' => $district->id,
            'court_type_id' => $type->id,
            'name' => $data['name'],
            'name_bn' => $data['name_bn'],
            'is_active' => $data['is_active'] ?? true,
        ]);
    }
}
