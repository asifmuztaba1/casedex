<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtType;

class UpdateCourtAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Court $court, array $data): Court
    {
        if (! empty($data['district_public_id'])) {
            $district = CourtDistrict::query()
                ->where('public_id', $data['district_public_id'])
                ->firstOrFail();

            $court->district_id = $district->id;
            $court->division_id = $district->division_id;
            $court->country_id = $district->country_id;
        }

        if (! empty($data['court_type_public_id'])) {
            $type = CourtType::query()
                ->where('public_id', $data['court_type_public_id'])
                ->firstOrFail();
            $court->court_type_id = $type->id;
        }

        $court->name = $data['name'];
        $court->name_bn = $data['name_bn'];

        if (array_key_exists('is_active', $data)) {
            $court->is_active = (bool) $data['is_active'];
        }

        $court->save();

        return $court;
    }
}
