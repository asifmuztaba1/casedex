<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Billing\Actions\CancelSubscriptionAction;
use App\Domain\Billing\Actions\ChangePlanAction;
use App\Domain\Billing\Actions\CreateCheckoutAction;
use App\Domain\Billing\Actions\GetCustomerPortalUrlAction;
use App\Domain\Billing\Actions\GetSubscriptionStateAction;
use App\Domain\Billing\Actions\ResumeSubscriptionAction;
use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BillingController extends Controller
{
    public function checkout(Request $request, CreateCheckoutAction $action): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required_without:add_unlimited_storage', Rule::in([
                TenantPlan::Starter->value,
                TenantPlan::Professional->value,
                TenantPlan::Chambers->value,
            ])],
            'interval' => ['required_without:add_unlimited_storage', Rule::in(['monthly', 'yearly'])],
            'add_unlimited_storage' => ['sometimes', 'boolean'],
        ]);

        $checkoutUrl = $action->handle(
            $request->user()->tenant,
            $data['plan'] ?? TenantPlan::Starter->value,
            $data['interval'] ?? 'monthly',
            (bool) ($data['add_unlimited_storage'] ?? false)
        );

        return response()->json([
            'data' => [
                'checkout_url' => $checkoutUrl,
            ],
        ]);
    }

    public function portal(Request $request, GetCustomerPortalUrlAction $action): JsonResponse
    {
        return response()->json([
            'data' => [
                'portal_url' => $action->handle($request->user()->tenant),
            ],
        ]);
    }

    public function subscription(Request $request, GetSubscriptionStateAction $action): JsonResponse
    {
        return response()->json([
            'data' => $action->handle($request->user()->tenant),
        ]);
    }

    public function changePlan(Request $request, ChangePlanAction $action): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', Rule::in([
                TenantPlan::Starter->value,
                TenantPlan::Professional->value,
                TenantPlan::Chambers->value,
            ])],
            'interval' => ['required', Rule::in(['monthly', 'yearly'])],
        ]);

        $subscription = $action->handle(
            $request->user()->tenant,
            $data['plan'],
            $data['interval']
        );

        return response()->json([
            'data' => [
                'status' => $subscription->status,
                'variant_id' => $subscription->variant_id,
                'renews_at' => $subscription->renews_at,
                'ends_at' => $subscription->ends_at,
            ],
        ]);
    }

    public function cancel(Request $request, CancelSubscriptionAction $action): JsonResponse
    {
        $subscription = $action->handle($request->user()->tenant);

        return response()->json([
            'data' => [
                'status' => $subscription->status,
                'ends_at' => $subscription->ends_at,
            ],
        ]);
    }

    public function resume(Request $request, ResumeSubscriptionAction $action): JsonResponse
    {
        $subscription = $action->handle($request->user()->tenant);

        return response()->json([
            'data' => [
                'status' => $subscription->status,
                'renews_at' => $subscription->renews_at,
                'ends_at' => $subscription->ends_at,
            ],
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $orders = $request->user()->tenant
            ->orders()
            ->limit(50)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'identifier' => $order->identifier,
                'order_number' => $order->order_number,
                'currency' => $order->currency,
                'total' => $order->total,
                'status' => $order->status,
                'receipt_url' => $order->receipt_url,
                'ordered_at' => $order->ordered_at,
            ]);

        return response()->json([
            'data' => $orders,
        ]);
    }

    public function planLimits(Request $request, PlanFeatureService $planFeatureService): JsonResponse
    {
        return response()->json([
            'data' => $planFeatureService->planLimits($request->user()->tenant),
        ]);
    }
}
