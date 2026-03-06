<?php

namespace App\Http\Middleware;

use App\Domain\Billing\Services\PlanFeatureService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveSubscription
{
    public function __construct(private readonly PlanFeatureService $planFeatureService)
    {
    }

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $request->user()?->tenant;

        if ($tenant === null) {
            abort(401, __('messages.tenant_context_missing'));
        }

        if ($this->planFeatureService->hasAccess($tenant)) {
            return $next($request);
        }

        return response()->json([
            'message' => __('messages.subscription_required'),
            'error' => 'subscription_required',
            'trial_ends_at' => $tenant->trial_ends_at,
        ], 403);
    }
}
