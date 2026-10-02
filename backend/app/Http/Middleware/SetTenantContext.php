<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401, __('messages.tenant_context_missing'));
        }

        // Signed in but no workspace yet (mid-onboarding). Not a 401: clients
        // treat 401 as "signed out" and would drop a valid session or token.
        if ($user->tenant_id === null) {
            return response()->json([
                'message' => __('messages.workspace_required'),
                'error' => 'workspace_required',
            ], 403);
        }

        TenantContext::set($user->tenant_id);

        try {
            return $next($request);
        } finally {
            TenantContext::clear();
        }
    }
}
