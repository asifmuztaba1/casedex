<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('hearings:send-reminders')->dailyAt('08:00');
        $schedule->command('billing:send-trial-ending-reminders')->dailyAt('09:00');
        $schedule->command('ai:grant-monthly-credits')->dailyAt('00:15');
        $schedule->command('billing:apply-manual-subscription-changes')->everyFifteenMinutes();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
    }
}
