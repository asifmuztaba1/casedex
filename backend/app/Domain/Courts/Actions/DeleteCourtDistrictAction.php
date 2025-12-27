<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtDistrict;

class DeleteCourtDistrictAction
{
    public function handle(CourtDistrict $district): void
    {
        $district->delete();
    }
}
