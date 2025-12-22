<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Documents\Actions\CreateDocumentAction;
use App\Domain\Documents\Actions\DeleteDocumentAction;
use App\Domain\Documents\Actions\FindDocumentAction;
use App\Domain\Documents\Actions\ListDocumentsAction;
use App\Domain\Documents\Actions\UpdateDocumentAction;
use App\Domain\Cases\Actions\FindCaseAction;
use App\Domain\Documents\Models\Document;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreDocumentRequest;
use App\Http\Requests\Api\V1\UpdateDocumentRequest;
use App\Http\Resources\Api\V1\DocumentResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(IndexRequest $request, ListDocumentsAction $action)
    {
        $this->authorize('viewAny', Document::class);

        $perPage = (int) ($request->input('per_page', 25));

        $documents = $action->handle($perPage, $request->input('cursor'));

        return DocumentResource::collection($documents);
    }

    public function indexForCase(
        string $casePublicId,
        IndexRequest $request,
        FindCaseAction $findCase,
        ListDocumentsAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('view', $case);

        $perPage = (int) ($request->input('per_page', 25));

        $documents = $action->handle($perPage, $request->input('cursor'), $case->id);

        return DocumentResource::collection($documents);
    }

    public function store(StoreDocumentRequest $request, CreateDocumentAction $action)
    {
        $this->authorize('create', Document::class);

        $document = $action->handle(
            $request->validated(),
            $request->input('case_public_id'),
            $request->input('hearing_public_id'),
            $request->file('file'),
            $request->user()
        );

        return new DocumentResource($document);
    }

    public function show(string $publicId, FindDocumentAction $action)
    {
        $document = $action->handle($publicId);

        $this->authorize('view', $document);

        return new DocumentResource($document);
    }

    public function update(
        string $publicId,
        UpdateDocumentRequest $request,
        FindDocumentAction $finder,
        UpdateDocumentAction $action
    ) {
        $document = $finder->handle($publicId);

        $this->authorize('update', $document);

        $document = $action->handle(
            $document,
            $request->validated(),
            $request->input('case_public_id'),
            $request->input('hearing_public_id'),
            $request->file('file'),
            $request->user()
        );

        return new DocumentResource($document);
    }

    public function download(string $publicId, Request $request, FindDocumentAction $finder)
    {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        $document = $finder->handle($publicId);

        $this->authorize('view', $document);

        return Storage::disk(config('filesystems.default'))
            ->download($document->storage_key, $document->original_name);
    }

    public function destroy(
        string $publicId,
        Request $request,
        FindDocumentAction $finder,
        DeleteDocumentAction $action
    ) {
        $document = $finder->handle($publicId);

        $this->authorize('delete', $document);

        $action->handle($document, $request->user());

        return response()->noContent();
    }
}
