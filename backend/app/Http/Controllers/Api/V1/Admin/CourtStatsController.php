<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CourtStatsController extends Controller
{
    public function index(Request $request): array
    {
        $this->authorize('viewAny', Court::class);

        $countryId = $request->input('country_id');

        $divisionQuery = CourtDivision::query();
        $districtQuery = CourtDistrict::query();
        $typeQuery = CourtType::query();
        $courtQuery = Court::query();

        if ($countryId) {
            $divisionQuery->where('country_id', $countryId);
            $districtQuery->where('country_id', $countryId);
            $typeQuery->where('country_id', $countryId);
            $courtQuery->where('country_id', $countryId);
        }

        return [
            'divisions' => $divisionQuery->count(),
            'districts' => $districtQuery->count(),
            'court_types' => $typeQuery->count(),
            'courts' => $courtQuery->count(),
        ];
    }
}
