<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Ai\Actions\ApproveAiManualPaymentRequestAction;
use App\Domain\Ai\Actions\RejectAiManualPaymentRequestAction;
use App\Domain\Ai\Models\AiManualPaymentRequest;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AiManualPaymentRequestResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AiManualPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'nullable', 'in:pending,approved,rejected,expired'],
            'tenant_public_id' => ['sometimes', 'nullable', 'string'],
            'date_from' => ['sometimes', 'nullable', 'date'],
            'date_to' => ['sometimes', 'nullable', 'date'],
        ]);

        $query = AiManualPaymentRequest::query()
            ->withoutGlobalScopes()
            ->with(['tenant', 'user', 'pack', 'reviewedBy'])
            ->latest('id');

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (! empty($data['tenant_public_id'])) {
            $query->whereHas('tenant', fn ($tenantQuery) => $tenantQuery->where('public_id', $data['tenant_public_id']));
        }

        if (! empty($data['date_from'])) {
            $query->whereDate('created_at', '>=', $data['date_from']);
        }

        if (! empty($data['date_to'])) {
            $query->whereDate('created_at', '<=', $data['date_to']);
        }

        $items = $query->paginate(25);

        return response()->json([
            'data' => AiManualPaymentRequestResource::collection($items->items())->resolve(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function approve(
        Request $request,
        string $publicId,
        ApproveAiManualPaymentRequestAction $action,
    ): JsonResponse {
        $manualRequest = AiManualPaymentRequest::query()->withoutGlobalScopes()->where('public_id', $publicId)->firstOrFail();
        $manualRequest = $action->handle($manualRequest, $request->user());

        return response()->json([
            'data' => new AiManualPaymentRequestResource($manualRequest),
        ]);
    }

    public function reject(
        Request $request,
        string $publicId,
        RejectAiManualPaymentRequestAction $action,
    ): JsonResponse {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $manualRequest = AiManualPaymentRequest::query()->withoutGlobalScopes()->where('public_id', $publicId)->firstOrFail();
        $manualRequest = $action->handle($manualRequest, $request->user(), $data['reason'] ?? null);

        return response()->json([
            'data' => new AiManualPaymentRequestResource($manualRequest),
        ]);
    }

    public function screenshot(string $publicId)
    {
        $manualRequest = AiManualPaymentRequest::query()
            ->withoutGlobalScopes()
            ->where('public_id', $publicId)
            ->firstOrFail();

        if ($manualRequest->status === ManualPaymentRequestStatus::Expired) {
            abort(404);
        }

        $disk = $manualRequest->screenshot_disk;
        $path = $manualRequest->screenshot_path;

        if (! Storage::disk($disk)->exists($path)) {
            abort(404);
        }

        return Storage::disk($disk)->download($path, 'ai-payment-proof-'.$manualRequest->public_id.'.'.pathinfo($path, PATHINFO_EXTENSION));
    }
}
