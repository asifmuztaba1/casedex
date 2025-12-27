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

        if ($user === null || $user->tenant_id === null) {
            abort(401, __('messages.tenant_context_missing'));
        }

        TenantContext::set($user->tenant_id);

        try {
            return $next($request);
        } finally {
            TenantContext::clear();
        }
    }
}
