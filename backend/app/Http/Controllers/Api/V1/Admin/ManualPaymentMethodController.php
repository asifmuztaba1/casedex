<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Billing\Models\ManualPaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreManualPaymentMethodRequest;
use App\Http\Requests\Api\V1\UpdateManualPaymentMethodRequest;
use App\Http\Resources\Api\V1\ManualPaymentMethodResource;
use Illuminate\Http\JsonResponse;

class ManualPaymentMethodController extends Controller
{
    public function index(): JsonResponse
    {
        $methods = ManualPaymentMethod::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => ManualPaymentMethodResource::collection($methods)->resolve(),
        ]);
    }

    public function store(StoreManualPaymentMethodRequest $request): JsonResponse
    {
        $method = ManualPaymentMethod::query()->create($request->validated());

        return response()->json([
            'data' => new ManualPaymentMethodResource($method),
        ], 201);
    }

    public function update(string $publicId, UpdateManualPaymentMethodRequest $request): JsonResponse
    {
        $method = ManualPaymentMethod::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $method->update($request->validated());

        return response()->json([
            'data' => new ManualPaymentMethodResource($method->fresh()),
        ]);
    }

    public function destroy(string $publicId): JsonResponse
    {
        $method = ManualPaymentMethod::query()
            ->where('public_id', $publicId)
            ->firstOrFail();

        $method->delete();

        return response()->json([], 204);
    }
}
