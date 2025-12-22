<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\CreateNotificationAction;
use App\Domain\Notifications\Actions\DeleteNotificationAction;
use App\Domain\Notifications\Actions\FindNotificationAction;
use App\Domain\Notifications\Actions\ListNotificationsAction;
use App\Domain\Notifications\Actions\UpdateNotificationAction;
use App\Domain\Notifications\Models\CaseNotification;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexRequest;
use App\Http\Requests\Api\V1\StoreNotificationRequest;
use App\Http\Requests\Api\V1\UpdateNotificationRequest;
use App\Http\Resources\Api\V1\NotificationResource;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(IndexRequest $request, ListNotificationsAction $action)
    {
        $this->authorize('viewAny', CaseNotification::class);

        $perPage = (int) ($request->input('per_page', 25));

        $notifications = $action->handle($perPage, $request->input('cursor'));

        return NotificationResource::collection($notifications);
    }

    public function store(StoreNotificationRequest $request, CreateNotificationAction $action)
    {
        $this->authorize('create', CaseNotification::class);

        $notification = $action->handle(
            $request->validated(),
            $request->input('case_public_id'),
            $request->input('hearing_public_id'),
            $request->input('user_public_id'),
            $request->user()
        );

        return new NotificationResource($notification);
    }

    public function show(string $publicId, FindNotificationAction $action)
    {
        $notification = $action->handle($publicId);

        $this->authorize('view', $notification);

        return new NotificationResource($notification);
    }

    public function update(
        string $publicId,
        UpdateNotificationRequest $request,
        FindNotificationAction $finder,
        UpdateNotificationAction $action
    ) {
        $notification = $finder->handle($publicId);

        $this->authorize('update', $notification);

        $notification = $action->handle(
            $notification,
            $request->validated(),
            $request->input('case_public_id'),
            $request->input('hearing_public_id'),
            $request->input('user_public_id'),
            $request->user()
        );

        return new NotificationResource($notification);
    }

    public function destroy(
        string $publicId,
        Request $request,
        FindNotificationAction $finder,
        DeleteNotificationAction $action
    ) {
        $notification = $finder->handle($publicId);

        $this->authorize('delete', $notification);

        $action->handle($notification, $request->user());

        return response()->noContent();
    }
}
