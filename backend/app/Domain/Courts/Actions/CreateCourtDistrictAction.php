<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;

class CreateCourtDistrictAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): CourtDistrict
    {
        $division = CourtDivision::query()
            ->where('public_id', $data['division_public_id'])
            ->firstOrFail();

        return CourtDistrict::create([
            'country_id' => $division->country_id,
            'division_id' => $division->id,
            'name' => $data['name'],
            'name_bn' => $data['name_bn'],
        ]);
    }
}
