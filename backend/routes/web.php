<?php

use App\Http\Controllers\Api\V1\AuthVerificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/verify-email/{id}/{hash}', [AuthVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('auth.verify-email');
