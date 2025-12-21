<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Diary\Actions\ListDiaryEntriesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Resources\Api\V1\DiaryEntryResource;

class DiaryEntryController extends Controller
{
    public function index(IndexRequest $request, ListDiaryEntriesAction $action)
    {
        $perPage = (int) ($request->input('per_page', 25));

        $entries = $action->handle($perPage, $request->input('cursor'));

        return DiaryEntryResource::collection($entries);
    }
}
