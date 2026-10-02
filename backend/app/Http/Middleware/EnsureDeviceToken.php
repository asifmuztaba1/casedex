<?php

namespace App\Http\Middleware;

use App\Domain\Auth\Models\DeviceToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Device endpoints act on "this device's token", so they need a Bearer
 * token; a browser session has none.
 */
class EnsureDeviceToken
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->currentAccessToken() instanceof DeviceToken) {
            abort(403, __('messages.mobile_token_required'));
        }

        return $next($request);
    }
}
