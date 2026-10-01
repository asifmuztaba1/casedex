<?php

use Illuminate\Support\Facades\Artisan;

/*
 * Horizon's worker extends the framework's queue:work and redefines its
 * options. When the framework adds an option Horizon doesn't know (Laravel
 * 13.34 added --stop-when-empty-for), every Horizon worker crashes on start
 * and no queued job (email, reminder, push, AI) runs. Keep them in step.
 */
it('keeps horizon:work in step with every queue:work option', function (): void {
    $commands = Artisan::all();
    $framework = $commands['queue:work']->getDefinition();
    $horizon = $commands['horizon:work']->getDefinition();

    $missing = collect($framework->getOptions())
        ->keys()
        ->reject(fn (string $name): bool => $horizon->hasOption($name))
        ->values()
        ->all();

    expect($missing)->toBe([]);
});
