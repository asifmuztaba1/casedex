<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Courts\Actions\CreateCourtTypeAction;
use App\Domain\Courts\Actions\DeleteCourtTypeAction;
use App\Domain\Courts\Actions\UpdateCourtTypeAction;
use App\Domain\Courts\Models\CourtType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCourtTypeRequest;
use App\Http\Requests\Api\V1\UpdateCourtTypeRequest;
use App\Http\Resources\Api\V1\CourtTypeResource;
use Illuminate\Http\Request;

class CourtTypeController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', CourtType::class);

        $query = CourtType::query();

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        $types = $query->orderBy('name')->get();

        return CourtTypeResource::collection($types);
    }

    public function store(StoreCourtTypeRequest $request, CreateCourtTypeAction $action)
    {
        $this->authorize('create', CourtType::class);

        $type = $action->handle($request->validated());

        return new CourtTypeResource($type);
    }

    public function update(
        string $publicId,
        UpdateCourtTypeRequest $request,
        UpdateCourtTypeAction $action
    ) {
        $type = CourtType::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('update', $type);

        $type = $action->handle($type, $request->validated());

        return new CourtTypeResource($type);
    }

    public function destroy(string $publicId, DeleteCourtTypeAction $action)
    {
        $type = CourtType::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $this->authorize('delete', $type);

        $action->handle($type);

        return response()->noContent();
    }
}
