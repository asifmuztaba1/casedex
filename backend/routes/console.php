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
