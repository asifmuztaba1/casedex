<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;

class UpdateCourtDistrictAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CourtDistrict $district, array $data): CourtDistrict
    {
        if (! empty($data['division_public_id'])) {
            $division = CourtDivision::query()
                ->where('public_id', $data['division_public_id'])
                ->firstOrFail();

            $district->division_id = $division->id;
            $district->country_id = $division->country_id;
        }

        $district->name = $data['name'];
        $district->name_bn = $data['name_bn'];
        $district->save();

        return $district;
    }
}
