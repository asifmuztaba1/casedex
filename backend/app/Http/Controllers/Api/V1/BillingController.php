<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Ai\Actions\SubmitAiManualPaymentRequestAction;
use App\Domain\Ai\Models\AiAlertRule;
use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Models\AiCreditPack;
use App\Domain\Ai\Models\AiManualPaymentRequest;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Billing\Actions\CancelSubscriptionAction;
use App\Domain\Billing\Actions\ChangePlanAction;
use App\Domain\Billing\Actions\CreateCheckoutAction;
use App\Domain\Billing\Actions\GetCustomerPortalUrlAction;
use App\Domain\Billing\Actions\GetSubscriptionStateAction;
use App\Domain\Billing\Actions\ResumeSubscriptionAction;
use App\Domain\Billing\Actions\SubmitManualPaymentRequestAction;
use App\Domain\Billing\Enums\ManualPaymentRequestStatus;
use App\Domain\Billing\Models\ManualPaymentMethod;
use App\Domain\Billing\Models\ManualPaymentRequest;
use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAiAlertRuleRequest;
use App\Http\Requests\Api\V1\StoreAiManualPaymentRequest;
use App\Http\Resources\Api\V1\AiAlertRuleResource;
use App\Http\Resources\Api\V1\AiCreditLedgerResource;
use App\Http\Resources\Api\V1\AiCreditPackResource;
use App\Http\Resources\Api\V1\AiManualPaymentRequestResource;
use App\Http\Requests\Api\V1\StoreManualPaymentRequest;
use App\Http\Resources\Api\V1\ManualPaymentMethodResource;
use App\Http\Resources\Api\V1\ManualPaymentRequestResource;
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
            'redirect_url' => ['sometimes', 'nullable', 'url'],
        ]);

        $checkoutUrl = $action->handle(
            $request->user()->tenant,
            $data['plan'] ?? TenantPlan::Starter->value,
            $data['interval'] ?? 'monthly',
            (bool) ($data['add_unlimited_storage'] ?? false),
            $data['redirect_url'] ?? null
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

    public function manualMethods(Request $request, PlanFeatureService $planFeatureService): JsonResponse
    {
        $tenant = $request->user()->tenant;
        $enabled = $tenant !== null && $planFeatureService->isManualMfsAvailableForTenant($tenant);
        $methods = collect();

        if ($enabled) {
            $methods = ManualPaymentMethod::query()
                ->where('active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();
        }

        return response()->json([
            'data' => [
                'enabled' => $enabled,
                'currency' => $planFeatureService->manualMfsCurrency(),
                'methods' => ManualPaymentMethodResource::collection($methods)->resolve(),
                'prices' => [
                    TenantPlan::Starter->value => [
                        'monthly' => $planFeatureService->manualMfsPriceFor(TenantPlan::Starter, 'monthly'),
                        'yearly' => $planFeatureService->manualMfsPriceFor(TenantPlan::Starter, 'yearly'),
                    ],
                    TenantPlan::Professional->value => [
                        'monthly' => $planFeatureService->manualMfsPriceFor(TenantPlan::Professional, 'monthly'),
                        'yearly' => $planFeatureService->manualMfsPriceFor(TenantPlan::Professional, 'yearly'),
                    ],
                    TenantPlan::Chambers->value => [
                        'monthly' => $planFeatureService->manualMfsPriceFor(TenantPlan::Chambers, 'monthly'),
                        'yearly' => $planFeatureService->manualMfsPriceFor(TenantPlan::Chambers, 'yearly'),
                    ],
                ],
                'temporary_access_hours' => (int) config('billing.manual_mfs.temporary_access_hours', 24),
                'can_submit_now' => $tenant !== null && $planFeatureService->canSubmitManualSubscriptionPayment($tenant),
                'trial_ends_at' => $tenant?->trial_ends_at,
            ],
        ]);
    }

    public function submitManualRequest(
        StoreManualPaymentRequest $request,
        SubmitManualPaymentRequestAction $action
    ): JsonResponse {
        $manualRequest = $action->handle(
            $request->user()->tenant,
            $request->user(),
            $request->validated(),
            $request->file('screenshot')
        );

        return response()->json([
            'data' => new ManualPaymentRequestResource($manualRequest),
        ], 201);
    }

    public function manualRequestStatus(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        $latestRequest = ManualPaymentRequest::query()
            ->with(['tenant', 'user', 'reviewedBy'])
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->first();

        if (
            $latestRequest !== null
            && $latestRequest->status === ManualPaymentRequestStatus::Pending
            && $latestRequest->temporary_access_expires_at !== null
            && $latestRequest->temporary_access_expires_at->isPast()
        ) {
            app(PlanFeatureService::class)->latestManualPaymentRequest($tenant);
            $latestRequest->refresh();
        }

        return response()->json([
            'data' => $latestRequest ? new ManualPaymentRequestResource($latestRequest) : null,
        ]);
    }

    public function aiCredits(Request $request, AiCreditService $creditService): JsonResponse
    {
        $tenant = $request->user()->tenant;
        $summary = $creditService->walletSummary($tenant);
        $packs = AiCreditPack::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $alertRules = AiAlertRule::query()->orderBy('threshold_credits')->get();

        return response()->json([
            'data' => [
                ...$summary,
                'pack_catalog' => AiCreditPackResource::collection($packs)->resolve(),
                'alert_rules' => AiAlertRuleResource::collection($alertRules)->resolve(),
            ],
        ]);
    }

    public function aiLedger(Request $request): JsonResponse
    {
        $items = AiCreditLedger::query()
            ->with('user')
            ->latest('id')
            ->paginate(50);

        return response()->json([
            'data' => AiCreditLedgerResource::collection($items->items())->resolve(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function aiCreditCheckout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pack_public_id' => ['required', 'string', 'max:64'],
            'redirect_url' => ['sometimes', 'nullable', 'url'],
        ]);

        $tenant = $request->user()->tenant;
        $pack = AiCreditPack::query()
            ->where('public_id', $data['pack_public_id'])
            ->where('active', true)
            ->first();

        if ($pack === null || $pack->lemon_variant_id === null) {
            abort(422, 'AI credit pack is not configured for Lemon checkout.');
        }

        $checkout = $tenant->checkout(
            (string) $pack->lemon_variant_id,
            options: [
                'checkout_options' => [
                    'embed' => false,
                ],
                'checkout_data' => [
                    'email' => $tenant->lemonSqueezyEmail(),
                    'billing_address' => [
                        'country' => $tenant->lemonSqueezyCountry(),
                    ],
                    'custom' => [
                        'tenant_public_id' => $tenant->public_id,
                        'pack_code' => $pack->code,
                    ],
                ],
                'product_options' => [
                    'redirect_url' => (string) ($data['redirect_url'] ?? config('app.frontend_url').'/settings/billing?ai=success'),
                ],
            ]
        );

        return response()->json([
            'data' => [
                'checkout_url' => $checkout->url,
            ],
        ]);
    }

    public function aiMfsRequest(
        StoreAiManualPaymentRequest $request,
        SubmitAiManualPaymentRequestAction $action
    ): JsonResponse {
        $manualRequest = $action->handle(
            $request->user()->tenant,
            $request->user(),
            $request->validated(),
            $request->file('screenshot')
        );

        return response()->json([
            'data' => new AiManualPaymentRequestResource($manualRequest),
        ], 201);
    }

    public function aiManualRequestStatus(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        $latestRequest = AiManualPaymentRequest::query()
            ->with(['pack', 'user', 'reviewedBy', 'tenant'])
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->first();

        return response()->json([
            'data' => $latestRequest ? new AiManualPaymentRequestResource($latestRequest) : null,
        ]);
    }

    public function aiAnalytics(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;
        $from = now()->subDays(30)->startOfDay();

        $timeline = AiCreditLedger::query()
            ->where('created_at', '>=', $from)
            ->orderBy('created_at')
            ->get(['event_type', 'feature', 'credits_delta', 'created_at']);

        $daily = AiCreditLedger::query()
            ->selectRaw('DATE(created_at) as day, SUM(credits_delta) as credits_delta')
            ->where('created_at', '>=', $from)
            ->groupByRaw('DATE(created_at)')
            ->orderBy('day')
            ->get();

        $featureBreakdown = AiCreditLedger::query()
            ->selectRaw('feature, SUM(ABS(credits_delta)) as credits_used')
            ->where('tenant_id', $tenant->id)
            ->where('event_type', 'consume')
            ->groupBy('feature')
            ->orderByDesc('credits_used')
            ->get();

        $userBreakdown = AiCreditLedger::query()
            ->with('user:id,public_id,name')
            ->selectRaw('user_id, SUM(ABS(credits_delta)) as credits_used')
            ->where('tenant_id', $tenant->id)
            ->where('event_type', 'consume')
            ->groupBy('user_id')
            ->orderByDesc('credits_used')
            ->get()
            ->map(fn ($item) => [
                'user_public_id' => $item->user?->public_id,
                'user_name' => $item->user?->name,
                'credits_used' => (int) $item->credits_used,
            ]);

        $payload = [
            'data' => [
                'timeline' => $timeline,
                'daily_aggregates' => $daily,
                'feature_breakdown' => $featureBreakdown,
                'user_breakdown' => $userBreakdown,
            ],
        ];

        if ($request->query('format') === 'csv') {
            $lines = ['section,key,value'];
            foreach ($daily as $row) {
                $lines[] = sprintf('daily,%s,%s', $row->day, $row->credits_delta);
            }
            foreach ($featureBreakdown as $row) {
                $lines[] = sprintf('feature,%s,%s', (string) ($row->feature ?? 'unknown'), $row->credits_used);
            }
            foreach ($userBreakdown as $row) {
                $lines[] = sprintf('user,%s,%s', (string) ($row['user_name'] ?? 'unknown'), $row['credits_used']);
            }

            return response()->json([
                'data' => $payload['data'],
                'csv' => implode("\n", $lines),
            ]);
        }

        return response()->json($payload);
    }

    public function listAiAlertRules(): JsonResponse
    {
        $rules = AiAlertRule::query()->orderBy('threshold_credits')->get();

        return response()->json([
            'data' => AiAlertRuleResource::collection($rules)->resolve(),
        ]);
    }

    public function storeAiAlertRule(StoreAiAlertRuleRequest $request): JsonResponse
    {
        $rule = AiAlertRule::query()->create([
            'tenant_id' => $request->user()->tenant_id,
            'threshold_credits' => $request->integer('threshold_credits'),
            'channel_in_app' => (bool) $request->boolean('channel_in_app', true),
            'channel_email' => (bool) $request->boolean('channel_email', true),
            'is_active' => (bool) $request->boolean('is_active', true),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'data' => new AiAlertRuleResource($rule),
        ], 201);
    }
}
