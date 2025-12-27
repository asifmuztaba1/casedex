<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', EnsureFrontendRequestsAreStateful::class);
        $middleware->prependToGroup('api', \App\Http\Middleware\SetLocale::class);
        $middleware->redirectGuestsTo(function ($request) {
            return $request->expectsJson() ? null : '/login';
        });

        $middleware->alias([
            'tenant' => \App\Http\Middleware\SetTenantContext::class,
            'platform' => \App\Http\Middleware\EnsurePlatformAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
