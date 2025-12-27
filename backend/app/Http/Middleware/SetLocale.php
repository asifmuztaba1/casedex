<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): \Symfony\Component\HttpFoundation\Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = null;
        $user = $request->user();

        if ($user?->locale) {
            $locale = $user->locale;
        } elseif ($user?->tenant?->locale) {
            $locale = $user->tenant->locale;
        }

        if (! $locale) {
            $locale = $request->header('X-Locale')
                ?? $request->header('Accept-Language');
        }

        if (is_string($locale)) {
            $locale = strtolower(substr($locale, 0, 2));
        }

        if (! in_array($locale, ['en', 'bn'], true)) {
            $locale = config('app.locale', 'en');
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
