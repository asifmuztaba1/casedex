<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Diary\Actions\CreateDiaryEntryAction;
use App\Domain\Diary\Actions\DeleteDiaryEntryAction;
use App\Domain\Diary\Actions\FindDiaryEntryAction;
use App\Domain\Diary\Actions\ListDiaryEntriesAction;
use App\Domain\Diary\Actions\UpdateDiaryEntryAction;
use App\Domain\Cases\Actions\FindCaseAction;
use App\Domain\Diary\Models\DiaryEntry;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreDiaryEntryRequest;
use App\Http\Requests\Api\V1\UpdateDiaryEntryRequest;
use App\Http\Resources\Api\V1\DiaryEntryResource;
use Illuminate\Http\Request;

class DiaryEntryController extends Controller
{
    public function index(IndexRequest $request, ListDiaryEntriesAction $action)
    {
        $this->authorize('viewAny', DiaryEntry::class);

        $perPage = (int) ($request->input('per_page', 25));

        $entries = $action->handle($perPage, $request->input('cursor'));

        return DiaryEntryResource::collection($entries);
    }

    public function indexForCase(
        string $casePublicId,
        IndexRequest $request,
        FindCaseAction $findCase,
        ListDiaryEntriesAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('view', $case);

        $perPage = (int) ($request->input('per_page', 25));

        $entries = $action->handle($perPage, $request->input('cursor'), $case->id);

        return DiaryEntryResource::collection($entries);
    }

    public function store(StoreDiaryEntryRequest $request, CreateDiaryEntryAction $action)
    {
        $this->authorize('create', DiaryEntry::class);

        $entry = $action->handle(
            $request->validated(),
            $request->input('case_public_id'),
            $request->input('hearing_public_id'),
            $request->user()
        );

        return new DiaryEntryResource($entry);
    }

    public function show(string $publicId, FindDiaryEntryAction $action)
    {
        $entry = $action->handle($publicId);

        $this->authorize('view', $entry);

        return new DiaryEntryResource($entry);
    }

    public function update(
        string $publicId,
        UpdateDiaryEntryRequest $request,
        FindDiaryEntryAction $finder,
        UpdateDiaryEntryAction $action
    ) {
        $entry = $finder->handle($publicId);

        $this->authorize('update', $entry);

        $entry = $action->handle(
            $entry,
            $request->validated(),
            $request->input('case_public_id'),
            $request->input('hearing_public_id'),
            $request->user()
        );

        return new DiaryEntryResource($entry);
    }

    public function destroy(
        string $publicId,
        Request $request,
        FindDiaryEntryAction $finder,
        DeleteDiaryEntryAction $action
    ) {
        $entry = $finder->handle($publicId);

        $this->authorize('delete', $entry);

        $action->handle($entry, $request->user());

        return response()->noContent();
    }
}
