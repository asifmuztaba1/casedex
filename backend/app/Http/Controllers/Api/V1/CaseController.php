<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cases\Actions\ListCasesAction;
use App\Domain\Cases\Actions\CreateCaseAction;
use App\Domain\Cases\Actions\DeleteCaseAction;
use App\Domain\Cases\Actions\FindCaseAction;
use App\Domain\Cases\Actions\UpdateCaseAction;
use App\Domain\Cases\Models\CaseFile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreCaseRequest;
use App\Http\Requests\Api\V1\UpdateCaseRequest;
use App\Http\Resources\Api\V1\CaseDetailResource;
use App\Http\Resources\Api\V1\CaseResource;
use Illuminate\Http\Request;

class CaseController extends Controller
{
    public function index(IndexRequest $request, ListCasesAction $action)
    {
        $this->authorize('viewAny', CaseFile::class);

        $perPage = (int) ($request->input('per_page', 25));

        $cases = $action->handle($perPage, $request->input('cursor'));

        return CaseResource::collection($cases);
    }

    public function store(StoreCaseRequest $request, CreateCaseAction $action)
    {
        $this->authorize('create', CaseFile::class);

        $case = $action->handle($request->validated(), $request->user());

        return new CaseResource($case);
    }

    public function show(string $publicId, FindCaseAction $action)
    {
        $case = $action->handle($publicId);

        $this->authorize('view', $case);

        $case->load([
            'client',
            'participants.user',
            'upcomingHearings',
            'recentDiaryEntries',
            'recentDocuments',
        ]);

        return new CaseDetailResource($case);
    }

    public function update(
        string $publicId,
        UpdateCaseRequest $request,
        FindCaseAction $finder,
        UpdateCaseAction $action
    ) {
        $case = $finder->handle($publicId);

        $this->authorize('update', $case);

        $case = $action->handle($case, $request->validated(), $request->user());

        return new CaseResource($case);
    }

    public function destroy(
        string $publicId,
        Request $request,
        FindCaseAction $finder,
        DeleteCaseAction $action
    ) {
        $case = $finder->handle($publicId);

        $this->authorize('delete', $case);

        $action->handle($case, $request->user());

        return response()->noContent();
    }
}
