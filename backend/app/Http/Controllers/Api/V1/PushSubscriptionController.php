<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notifications\Actions\DeletePushSubscriptionAction;
use App\Domain\Notifications\Actions\ListPushSubscriptionsAction;
use App\Domain\Notifications\Actions\UpsertPushSubscriptionAction;
use App\Domain\Notifications\Models\PushSubscription;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StorePushSubscriptionRequest;
use App\Http\Resources\Api\V1\PushSubscriptionResource;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function index(Request $request, ListPushSubscriptionsAction $action)
    {
        $this->authorize('viewAny', PushSubscription::class);

        $subscriptions = $action->handle($request->user());

        return PushSubscriptionResource::collection($subscriptions);
    }

    public function store(StorePushSubscriptionRequest $request, UpsertPushSubscriptionAction $action)
    {
        $this->authorize('create', PushSubscription::class);

        $subscription = $action->handle($request->validated(), $request->user());

        return new PushSubscriptionResource($subscription);
    }

    public function destroy(string $endpointHash, Request $request, DeletePushSubscriptionAction $action)
    {
        $this->authorize('create', PushSubscription::class);

        $action->handle($endpointHash, $request->user());

        return response()->noContent();
    }
}
