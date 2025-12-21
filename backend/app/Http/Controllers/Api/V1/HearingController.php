<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Hearings\Actions\ListHearingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Resources\Api\V1\HearingResource;

class HearingController extends Controller
{
    public function index(IndexRequest $request, ListHearingsAction $action)
    {
        $perPage = (int) ($request->input('per_page', 25));

        $hearings = $action->handle($perPage, $request->input('cursor'));

        return HearingResource::collection($hearings);
    }
}
