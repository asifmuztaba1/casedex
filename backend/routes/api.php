<?php

use App\Http\Controllers\Api\V1\CaseController;
use App\Http\Controllers\Api\V1\CaseParticipantController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\DiaryEntryController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\HearingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ResearchNoteController;
use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'tenant'])
    ->group(function (): void {
        Route::get('/cases', [CaseController::class, 'index']);
        Route::post('/cases', [CaseController::class, 'store']);
        Route::get('/cases/{publicId}', [CaseController::class, 'show']);
        Route::put('/cases/{publicId}', [CaseController::class, 'update']);
        Route::delete('/cases/{publicId}', [CaseController::class, 'destroy']);

        Route::get('/cases/{casePublicId}/hearings', [HearingController::class, 'indexForCase']);
        Route::post('/cases/{casePublicId}/hearings', [HearingController::class, 'store']);
        Route::get('/cases/{casePublicId}/diary', [DiaryEntryController::class, 'indexForCase']);
        Route::post('/cases/{casePublicId}/diary', [DiaryEntryController::class, 'store']);
        Route::get('/cases/{casePublicId}/documents', [DocumentController::class, 'indexForCase']);
        Route::post('/cases/{casePublicId}/documents', [DocumentController::class, 'store']);
        Route::get('/cases/{casePublicId}/participants', [CaseParticipantController::class, 'index']);
        Route::post('/cases/{casePublicId}/participants', [CaseParticipantController::class, 'store']);
        Route::delete('/cases/{casePublicId}/participants/{participantId}', [CaseParticipantController::class, 'destroy']);

        Route::get('/clients', [ClientController::class, 'index']);
        Route::post('/clients', [ClientController::class, 'store']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);
        Route::put('/clients/{id}', [ClientController::class, 'update']);
        Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

        Route::get('/hearings', [HearingController::class, 'index']);
        Route::post('/hearings', [HearingController::class, 'store']);
        Route::get('/hearings/{publicId}', [HearingController::class, 'show']);
        Route::put('/hearings/{publicId}', [HearingController::class, 'update']);
        Route::delete('/hearings/{publicId}', [HearingController::class, 'destroy']);

        Route::get('/diary-entries', [DiaryEntryController::class, 'index']);
        Route::post('/diary-entries', [DiaryEntryController::class, 'store']);
        Route::get('/diary-entries/{publicId}', [DiaryEntryController::class, 'show']);
        Route::put('/diary-entries/{publicId}', [DiaryEntryController::class, 'update']);
        Route::delete('/diary-entries/{publicId}', [DiaryEntryController::class, 'destroy']);

        Route::get('/documents', [DocumentController::class, 'index']);
        Route::post('/documents', [DocumentController::class, 'store']);
        Route::get('/documents/{publicId}', [DocumentController::class, 'show']);
        Route::get('/documents/{publicId}/download', [DocumentController::class, 'download'])
            ->name('api.v1.documents.download');
        Route::put('/documents/{publicId}', [DocumentController::class, 'update']);
        Route::delete('/documents/{publicId}', [DocumentController::class, 'destroy']);

        Route::get('/research-notes', [ResearchNoteController::class, 'index']);
        Route::post('/research-notes', [ResearchNoteController::class, 'store']);
        Route::get('/research-notes/{publicId}', [ResearchNoteController::class, 'show']);
        Route::put('/research-notes/{publicId}', [ResearchNoteController::class, 'update']);
        Route::delete('/research-notes/{publicId}', [ResearchNoteController::class, 'destroy']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications', [NotificationController::class, 'store']);
        Route::get('/notifications/{publicId}', [NotificationController::class, 'show']);
        Route::put('/notifications/{publicId}', [NotificationController::class, 'update']);
        Route::delete('/notifications/{publicId}', [NotificationController::class, 'destroy']);
    });
