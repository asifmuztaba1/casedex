<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Documents\Actions\ListDocumentsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Resources\Api\V1\DocumentResource;

class DocumentController extends Controller
{
    public function index(IndexRequest $request, ListDocumentsAction $action)
    {
        $perPage = (int) ($request->input('per_page', 25));

        $documents = $action->handle($perPage, $request->input('cursor'));

        return DocumentResource::collection($documents);
    }
}
