<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Courts\Actions\CreateCourtDistrictAction;
use App\Domain\Courts\Actions\DeleteCourtDistrictAction;
use App\Domain\Courts\Actions\UpdateCourtDistrictAction;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCourtDistrictRequest;
use App\Http\Requests\Api\V1\UpdateCourtDistrictRequest;
use App\Http\Resources\Api\V1\CourtDistrictResource;
use Illuminate\Http\Request;

class CourtDistrictController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', CourtDistrict::class);

        $query = CourtDistrict::query()->with('division');

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->input('division_id'));
        }

        if ($request->filled('division_public_id')) {
            $divisionId = CourtDivision::query()
                ->where('public_id', $request->input('division_public_id'))
                ->value('id');

            if ($divisionId) {
                $query->where('division_id', $divisionId);
            }
        }

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        $districts = $query->orderBy('name')->get();

        return CourtDistrictResource::collection($districts);
    }

    public function store(StoreCourtDistrictRequest $request, CreateCourtDistrictAction $action)
    {
        $this->authorize('create', CourtDistrict::class);

        $district = $action->handle($request->validated());

        $district->load('division');

        return new CourtDistrictResource($district);
    }

    public function update(
        string $publicId,
        UpdateCourtDistrictRequest $request,
        UpdateCourtDistrictAction $action
    ) {
        $district = CourtDistrict::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('update', $district);

        $district = $action->handle($district, $request->validated());

        $district->load('division');

        return new CourtDistrictResource($district);
    }

    public function destroy(string $publicId, DeleteCourtDistrictAction $action)
    {
        $district = CourtDistrict::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('delete', $district);

        $action->handle($district);

        return response()->noContent();
    }
}
