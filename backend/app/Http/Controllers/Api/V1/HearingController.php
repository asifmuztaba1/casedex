<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Hearings\Actions\CreateHearingAction;
use App\Domain\Hearings\Actions\DeleteHearingAction;
use App\Domain\Hearings\Actions\FindHearingAction;
use App\Domain\Hearings\Actions\ListHearingsAction;
use App\Domain\Hearings\Actions\UpdateHearingAction;
use App\Domain\Cases\Actions\FindCaseAction;
use App\Domain\Hearings\Models\Hearing;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreHearingRequest;
use App\Http\Requests\Api\V1\UpdateHearingRequest;
use App\Http\Resources\Api\V1\HearingResource;
use Illuminate\Http\Request;

class HearingController extends Controller
{
    public function index(IndexRequest $request, ListHearingsAction $action)
    {
        $this->authorize('viewAny', Hearing::class);

        $perPage = (int) ($request->input('per_page', 25));

        $hearings = $action->handle($perPage, $request->input('cursor'));

        return HearingResource::collection($hearings);
    }

    public function indexForCase(
        string $casePublicId,
        IndexRequest $request,
        FindCaseAction $findCase,
        ListHearingsAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('view', $case);

        $perPage = (int) ($request->input('per_page', 25));

        $hearings = $action->handle($perPage, $request->input('cursor'), $case->id);

        return HearingResource::collection($hearings);
    }

    public function store(StoreHearingRequest $request, CreateHearingAction $action)
    {
        $this->authorize('create', Hearing::class);

        $hearing = $action->handle(
            $request->validated(),
            $request->input('case_public_id'),
            $request->user()
        );

        return new HearingResource($hearing);
    }

    public function show(string $publicId, FindHearingAction $action)
    {
        $hearing = $action->handle($publicId);

        $this->authorize('view', $hearing);

        return new HearingResource($hearing);
    }

    public function update(
        string $publicId,
        UpdateHearingRequest $request,
        FindHearingAction $finder,
        UpdateHearingAction $action
    ) {
        $hearing = $finder->handle($publicId);

        $this->authorize('update', $hearing);

        $hearing = $action->handle(
            $hearing,
            $request->validated(),
            $request->input('case_public_id'),
            $request->user()
        );

        return new HearingResource($hearing);
    }

    public function destroy(
        string $publicId,
        Request $request,
        FindHearingAction $finder,
        DeleteHearingAction $action
    ) {
        $hearing = $finder->handle($publicId);

        $this->authorize('delete', $hearing);

        $action->handle($hearing, $request->user());

        return response()->noContent();
    }
}
