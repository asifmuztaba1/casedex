<?php

use App\Http\Controllers\Api\V1\CaseController;
use App\Http\Controllers\Api\V1\DiaryEntryController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\HearingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ResearchNoteController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'tenant'])
    ->group(function (): void {
        Route::get('/cases', [CaseController::class, 'index']);
        Route::get('/hearings', [HearingController::class, 'index']);
        Route::get('/diary-entries', [DiaryEntryController::class, 'index']);
        Route::get('/documents', [DocumentController::class, 'index']);
        Route::get('/research-notes', [ResearchNoteController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
    });
