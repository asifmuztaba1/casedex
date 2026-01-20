<?php

use App\Http\Controllers\Api\V1\CaseController;
use App\Http\Controllers\Api\V1\CaseParticipantController;
use App\Http\Controllers\Api\V1\CasePartyController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\CourtLookupController;
use App\Http\Controllers\Api\V1\DiaryEntryController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\HearingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ResearchNoteController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuthPasswordController;
use App\Http\Controllers\Api\V1\AuthVerificationController;
use App\Http\Controllers\Api\V1\CountryController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\Admin\CourtController as AdminCourtController;
use App\Http\Controllers\Api\V1\Admin\CourtDistrictController as AdminCourtDistrictController;
use App\Http\Controllers\Api\V1\Admin\CourtDivisionController as AdminCourtDivisionController;
use App\Http\Controllers\Api\V1\Admin\CourtStatsController as AdminCourtStatsController;
use App\Http\Controllers\Api\V1\Admin\CourtTypeController as AdminCourtTypeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/countries', [CountryController::class, 'index']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/forgot-password', [AuthPasswordController::class, 'sendResetLink'])
        ->middleware('throttle:6,1');
    Route::post('/auth/reset-password', [AuthPasswordController::class, 'reset'])
        ->middleware('throttle:6,1');
    Route::get('/auth/verify-email/{id}/{hash}', [AuthVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('api.v1.auth.verify-email');
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/email/verification-notification', [AuthVerificationController::class, 'resend'])
            ->middleware('throttle:6,1');
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/tenants', [TenantController::class, 'store']);
    });
});

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'platform'])
    ->group(function (): void {
        Route::get('/admin/court-stats', [AdminCourtStatsController::class, 'index']);
        Route::get('/admin/court-divisions', [AdminCourtDivisionController::class, 'index']);
        Route::post('/admin/court-divisions', [AdminCourtDivisionController::class, 'store']);
        Route::put('/admin/court-divisions/{publicId}', [AdminCourtDivisionController::class, 'update']);
        Route::delete('/admin/court-divisions/{publicId}', [AdminCourtDivisionController::class, 'destroy']);

        Route::get('/admin/court-districts', [AdminCourtDistrictController::class, 'index']);
        Route::post('/admin/court-districts', [AdminCourtDistrictController::class, 'store']);
        Route::put('/admin/court-districts/{publicId}', [AdminCourtDistrictController::class, 'update']);
        Route::delete('/admin/court-districts/{publicId}', [AdminCourtDistrictController::class, 'destroy']);

        Route::get('/admin/court-types', [AdminCourtTypeController::class, 'index']);
        Route::post('/admin/court-types', [AdminCourtTypeController::class, 'store']);
        Route::put('/admin/court-types/{publicId}', [AdminCourtTypeController::class, 'update']);
        Route::delete('/admin/court-types/{publicId}', [AdminCourtTypeController::class, 'destroy']);

        Route::get('/admin/courts', [AdminCourtController::class, 'index']);
        Route::post('/admin/courts', [AdminCourtController::class, 'store']);
        Route::put('/admin/courts/{publicId}', [AdminCourtController::class, 'update']);
        Route::delete('/admin/courts/{publicId}', [AdminCourtController::class, 'destroy']);
    });

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'tenant'])
    ->group(function (): void {
        Route::get('/courts', [CourtLookupController::class, 'index']);
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
        Route::get('/cases/{casePublicId}/parties', [CasePartyController::class, 'index']);
        Route::post('/cases/{casePublicId}/parties', [CasePartyController::class, 'store']);
        Route::put('/cases/{casePublicId}/parties/{partyId}', [CasePartyController::class, 'update']);
        Route::delete('/cases/{casePublicId}/parties/{partyId}', [CasePartyController::class, 'destroy']);

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

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{publicId}', [UserController::class, 'update']);
    });
