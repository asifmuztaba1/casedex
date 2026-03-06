<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Billing\Actions\ApproveManualPaymentRequestAction;
use App\Domain\Billing\Actions\RejectManualPaymentRequestAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ManualPaymentRequestResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ManualPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(array_column(ManualPaymentRequestStatus::cases(), 'value'))],
            'tenant' => ['sometimes', 'string', 'max:255'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = ManualPaymentRequest::query()
            ->with(['tenant', 'user', 'reviewedBy'])
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

        if (! empty($data['date_from'])) {
            $query->whereDate('sent_at', '>=', $data['date_from']);
        }

        if (! empty($data['date_to'])) {
            $query->whereDate('sent_at', '<=', $data['date_to']);
        }

        $items = $query
            ->limit((int) ($data['limit'] ?? 50))
            ->get();

        return response()->json([
            'data' => ManualPaymentRequestResource::collection($items)->resolve(),
        ]);
    }

    public function approve(
        string $publicId,
        Request $request,
        ApproveManualPaymentRequestAction $action
    ): JsonResponse {
        $manualRequest = ManualPaymentRequest::query()
            ->with(['tenant', 'user', 'reviewedBy'])
            ->where('public_id', $publicId)
            ->firstOrFail();

        $manualRequest = $action->handle($manualRequest, $request->user());

        return response()->json([
            'data' => new ManualPaymentRequestResource($manualRequest),
        ]);
    }

    public function reject(
        string $publicId,
        Request $request,
        RejectManualPaymentRequestAction $action
    ): JsonResponse {
        $data = $request->validate([
            'reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $manualRequest = ManualPaymentRequest::query()
            ->with(['tenant', 'user', 'reviewedBy'])
            ->where('public_id', $publicId)
            ->firstOrFail();

        $manualRequest = $action->handle($manualRequest, $request->user(), $data['reason'] ?? null);

        return response()->json([
            'data' => new ManualPaymentRequestResource($manualRequest),
        ]);
    }

    public function screenshot(string $publicId)
    {
        $manualRequest = ManualPaymentRequest::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $disk = $manualRequest->screenshot_disk;
        $path = $manualRequest->screenshot_path;

        if (! Storage::disk($disk)->exists($path)) {
            abort(404, 'Screenshot file not found.');
        }

        return Storage::disk($disk)->download($path);
    }
}
