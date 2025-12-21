<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\ListNotificationsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Resources\Api\V1\NotificationResource;

class NotificationController extends Controller
{
    public function index(IndexRequest $request, ListNotificationsAction $action)
    {
        $perPage = (int) ($request->input('per_page', 25));

        $notifications = $action->handle($perPage, $request->input('cursor'));

        return NotificationResource::collection($notifications);
    }
}
