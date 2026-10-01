<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('judiciary:scrape-causelist')
    ->dailyAt('04:30')
    ->timezone('Asia/Dhaka')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('app:send-daily-briefing')
    ->dailyAt('07:00')
    ->timezone('Asia/Dhaka')
    ->withoutOverlapping()
    ->runInBackground();

// User-facing reminders run in Bangladesh time.
Schedule::command('hearings:send-reminders')
    ->dailyAt('08:00')
    ->timezone('Asia/Dhaka')
    ->withoutOverlapping();

Schedule::command('billing:send-trial-ending-reminders')
    ->dailyAt('09:00')
    ->timezone('Asia/Dhaka')
    ->withoutOverlapping();

Schedule::command('ai:grant-monthly-credits')
    ->dailyAt('00:15')
    ->withoutOverlapping();

Schedule::command('billing:apply-manual-subscription-changes')
    ->everyFifteenMinutes()
    ->withoutOverlapping();

Schedule::command('backup:clean')->dailyAt('01:00');
Schedule::command('backup:run --only-db')->dailyAt('01:30');
