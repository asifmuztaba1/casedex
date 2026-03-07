<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Billing\Actions\SubmitManualSubscriptionChangeRequestAction;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreManualSubscriptionChangeRequest;
use App\Http\Resources\Api\V1\ManualSubscriptionChangeRequestResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManualSubscriptionChangeController extends Controller
{
    public function store(
        StoreManualSubscriptionChangeRequest $request,
        SubmitManualSubscriptionChangeRequestAction $action
    ): JsonResponse {
        $changeRequest = $action->handle(
            $request->user()->tenant,
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'data' => new ManualSubscriptionChangeRequestResource($changeRequest),
        ], 201);
    }

    public function status(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        $latest = ManualSubscriptionChangeRequest::query()
            ->with(['tenant', 'requester', 'reviewer'])
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->first();

        return response()->json([
            'data' => $latest ? new ManualSubscriptionChangeRequestResource($latest) : null,
        ]);
    }
}
