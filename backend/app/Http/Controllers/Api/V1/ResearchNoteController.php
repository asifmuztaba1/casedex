<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Research\Actions\ListResearchNotesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Resources\Api\V1\ResearchNoteResource;

class ResearchNoteController extends Controller
{
    public function index(IndexRequest $request, ListResearchNotesAction $action)
    {
        $perPage = (int) ($request->input('per_page', 25));

        $notes = $action->handle($perPage, $request->input('cursor'));

        return ResearchNoteResource::collection($notes);
    }
}
