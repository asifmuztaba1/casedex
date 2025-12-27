<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Courts\Actions\CreateCourtAction;
use App\Domain\Courts\Actions\DeleteCourtAction;
use App\Domain\Courts\Actions\UpdateCourtAction;
use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCourtRequest;
use App\Http\Requests\Api\V1\UpdateCourtRequest;
use App\Http\Resources\Api\V1\CourtResource;
use Illuminate\Http\Request;

class CourtController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Court::class);

        $query = Court::query()->with(['division', 'district', 'type']);

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->input('district_id'));
        }

        if ($request->filled('district_public_id')) {
            $districtId = CourtDistrict::query()
                ->where('public_id', $request->input('district_public_id'))
                ->value('id');

            if ($districtId) {
                $query->where('district_id', $districtId);
            }
        }

        if ($request->filled('court_type_id')) {
            $query->where('court_type_id', $request->input('court_type_id'));
        }

        if ($request->filled('court_type_public_id')) {
            $courtTypeId = CourtType::query()
                ->where('public_id', $request->input('court_type_public_id'))
                ->value('id');

            if ($courtTypeId) {
                $query->where('court_type_id', $courtTypeId);
            }
        }

        $courts = $query->orderBy('name')->get();

        return CourtResource::collection($courts);
    }

    public function store(StoreCourtRequest $request, CreateCourtAction $action)
    {
        $this->authorize('create', Court::class);

        $court = $action->handle($request->validated());

        $court->load(['division', 'district', 'type']);

        return new CourtResource($court);
    }

    public function update(
        string $publicId,
        UpdateCourtRequest $request,
        UpdateCourtAction $action
    ) {
        $court = Court::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('update', $court);

        $court = $action->handle($court, $request->validated());

        $court->load(['division', 'district', 'type']);

        return new CourtResource($court);
    }

    public function destroy(string $publicId, DeleteCourtAction $action)
    {
        $court = Court::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('delete', $court);

        $action->handle($court);

        return response()->noContent();
    }
}
