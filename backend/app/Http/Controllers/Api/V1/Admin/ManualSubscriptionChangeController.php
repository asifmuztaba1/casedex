<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Billing\Actions\ApproveManualSubscriptionChangeRequestAction;
use App\Domain\Billing\Actions\RejectManualSubscriptionChangeRequestAction;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ManualSubscriptionChangeRequestResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManualSubscriptionChangeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'string', 'in:pending,approved,rejected,applied'],
            'tenant' => ['sometimes', 'string', 'max:255'],
        ]);

        $query = ManualSubscriptionChangeRequest::query()
            ->with(['tenant', 'requester', 'reviewer'])
            ->latest('id');

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (! empty($data['tenant'])) {
            $tenantFilter = trim((string) $data['tenant']);
            $query->whereHas('tenant', function ($tenantQuery) use ($tenantFilter): void {
                $tenantQuery->where('name', 'like', "%{$tenantFilter}%")
                    ->orWhere('public_id', $tenantFilter);
            });
        }

        return response()->json([
            'data' => ManualSubscriptionChangeRequestResource::collection($query->limit(100)->get())->resolve(),
        ]);
    }

    public function approve(
        string $publicId,
        Request $request,
        ApproveManualSubscriptionChangeRequestAction $action
    ): JsonResponse {
        $data = $request->validate([
            'effective_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $changeRequest = ManualSubscriptionChangeRequest::query()
            ->with(['tenant', 'requester', 'reviewer'])
            ->where('public_id', $publicId)
            ->firstOrFail();

        $changeRequest = $action->handle($changeRequest, $request->user(), $data['effective_at'] ?? null);

        return response()->json([
            'data' => new ManualSubscriptionChangeRequestResource($changeRequest),
        ]);
    }

    public function reject(
        string $publicId,
        Request $request,
        RejectManualSubscriptionChangeRequestAction $action
    ): JsonResponse {
        $data = $request->validate([
            'reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $changeRequest = ManualSubscriptionChangeRequest::query()
            ->with(['tenant', 'requester', 'reviewer'])
            ->where('public_id', $publicId)
            ->firstOrFail();

        $changeRequest = $action->handle($changeRequest, $request->user(), $data['reason'] ?? null);

        return response()->json([
            'data' => new ManualSubscriptionChangeRequestResource($changeRequest),
        ]);
    }
}
