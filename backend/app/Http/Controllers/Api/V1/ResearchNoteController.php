<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Research\Actions\CreateResearchNoteAction;
use App\Domain\Research\Actions\DeleteResearchNoteAction;
use App\Domain\Research\Actions\FindResearchNoteAction;
use App\Domain\Research\Actions\ListResearchNotesAction;
use App\Domain\Research\Actions\UpdateResearchNoteAction;
use App\Domain\Research\Models\ResearchNote;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreResearchNoteRequest;
use App\Http\Requests\Api\V1\UpdateResearchNoteRequest;
use App\Http\Resources\Api\V1\ResearchNoteResource;
use Illuminate\Http\Request;

class ResearchNoteController extends Controller
{
    public function index(IndexRequest $request, ListResearchNotesAction $action)
    {
        $this->authorize('viewAny', ResearchNote::class);

        $perPage = (int) ($request->input('per_page', 25));

        $notes = $action->handle($perPage, $request->input('cursor'));

        return ResearchNoteResource::collection($notes);
    }

    public function store(StoreResearchNoteRequest $request, CreateResearchNoteAction $action)
    {
        $this->authorize('create', ResearchNote::class);

        $note = $action->handle($request->validated(), $request->user());

        return new ResearchNoteResource($note);
    }

    public function show(string $publicId, FindResearchNoteAction $action)
    {
        $note = $action->handle($publicId);

        $this->authorize('view', $note);

        return new ResearchNoteResource($note);
    }

    public function update(
        string $publicId,
        UpdateResearchNoteRequest $request,
        FindResearchNoteAction $finder,
        UpdateResearchNoteAction $action
    ) {
        $note = $finder->handle($publicId);

        $this->authorize('update', $note);

        $note = $action->handle($note, $request->validated(), $request->user());

        return new ResearchNoteResource($note);
    }

    public function destroy(
        string $publicId,
        Request $request,
        FindResearchNoteAction $finder,
        DeleteResearchNoteAction $action
    ) {
        $note = $finder->handle($publicId);

        $this->authorize('delete', $note);

        $action->handle($note, $request->user());

        return response()->noContent();
    }
}
