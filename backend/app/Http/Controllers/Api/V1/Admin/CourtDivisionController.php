<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Courts\Actions\CreateCourtDivisionAction;
use App\Domain\Courts\Actions\DeleteCourtDivisionAction;
use App\Domain\Courts\Actions\UpdateCourtDivisionAction;
use App\Domain\Courts\Models\CourtDivision;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCourtDivisionRequest;
use App\Http\Requests\Api\V1\UpdateCourtDivisionRequest;
use App\Http\Resources\Api\V1\CourtDivisionResource;
use Illuminate\Http\Request;

class CourtDivisionController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', CourtDivision::class);

        $query = CourtDivision::query();

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        $divisions = $query->orderBy('name')->get();

        return CourtDivisionResource::collection($divisions);
    }

    public function store(StoreCourtDivisionRequest $request, CreateCourtDivisionAction $action)
    {
        $this->authorize('create', CourtDivision::class);

        $division = $action->handle($request->validated());

        return new CourtDivisionResource($division);
    }

    public function update(
        string $publicId,
        UpdateCourtDivisionRequest $request,
        UpdateCourtDivisionAction $action
    ) {
        $division = CourtDivision::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('update', $division);

        $division = $action->handle($division, $request->validated());

        return new CourtDivisionResource($division);
    }

    public function destroy(string $publicId, DeleteCourtDivisionAction $action)
    {
        $division = CourtDivision::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('delete', $division);

        $action->handle($division);

        return response()->noContent();
    }
}
