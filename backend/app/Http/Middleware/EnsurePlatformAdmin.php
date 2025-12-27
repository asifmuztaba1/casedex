<?php

namespace App\Http\Middleware;

use App\Domain\Auth\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || !in_array($user->role?->value, UserRole::platformRoles(), true)) {
            abort(403, __('messages.auth_forbidden'));
        }

        return $next($request);
    }
}
