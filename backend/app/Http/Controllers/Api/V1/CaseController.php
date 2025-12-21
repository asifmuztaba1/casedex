<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cases\Actions\ListCasesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Resources\Api\V1\CaseResource;

class CaseController extends Controller
{
    public function index(IndexRequest $request, ListCasesAction $action)
    {
        $perPage = (int) ($request->input('per_page', 25));

        $cases = $action->handle($perPage, $request->input('cursor'));

        return CaseResource::collection($cases);
    }
}
