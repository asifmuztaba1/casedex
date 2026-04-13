<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Feedback\Actions\CreateFeedbackAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreFeedbackRequest;
use App\Http\Resources\Api\V1\FeedbackResource;

class FeedbackController extends Controller
{
    public function store(StoreFeedbackRequest $request, CreateFeedbackAction $action)
    {
        $feedback = $action->handle($request->user(), $request->validated());

        return new FeedbackResource($feedback);
    }
}
