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
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\Admin\ManualPaymentController as AdminManualPaymentController;
use App\Http\Controllers\Api\V1\Admin\ManualPaymentMethodController as AdminManualPaymentMethodController;
use App\Http\Controllers\Api\V1\ResearchNoteController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuthPasswordController;
use App\Http\Controllers\Api\V1\AuthVerificationController;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\Admin\AiManualPaymentController as AdminAiManualPaymentController;
use App\Http\Controllers\Api\V1\CountryController;
use App\Http\Controllers\Api\V1\PushSubscriptionController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ManualSubscriptionChangeController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\Admin\CourtController as AdminCourtController;
use App\Http\Controllers\Api\V1\Admin\ManualSubscriptionChangeController as AdminManualSubscriptionChangeController;
use App\Http\Controllers\Api\V1\Admin\CourtDistrictController as AdminCourtDistrictController;
use App\Http\Controllers\Api\V1\Admin\CourtDivisionController as AdminCourtDivisionController;
use App\Http\Controllers\Api\V1\Admin\CourtStatsController as AdminCourtStatsController;
use App\Http\Controllers\Api\V1\Admin\CourtTypeController as AdminCourtTypeController;
use App\Http\Controllers\Api\V1\Admin\PlatformAnalyticsController as AdminPlatformAnalyticsController;
use App\Http\Controllers\Api\V1\Admin\SupportTicketController as AdminSupportTicketController;
use App\Http\Controllers\Api\V1\Admin\TenantController as AdminTenantController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\FeedbackController;
use App\Http\Controllers\Api\V1\SupportTicketController;
use App\Http\Controllers\Api\V1\Admin\FeedbackController as AdminFeedbackController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/countries', [CountryController::class, 'index']);
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:auth');
    Route::post('/auth/register', [AuthController::class, 'register'])
        ->middleware('throttle:auth');
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

        Route::get('/support/tickets', [SupportTicketController::class, 'index']);
        Route::post('/support/tickets', [SupportTicketController::class, 'store']);
        Route::get('/support/tickets/{publicId}', [SupportTicketController::class, 'show']);
        Route::get('/support/tickets/{publicId}/messages', [SupportTicketController::class, 'messages']);
        Route::post('/support/tickets/{publicId}/messages', [SupportTicketController::class, 'reply']);
        Route::get('/support/attachments/{messagePublicId}', [SupportTicketController::class, 'attachment'])
            ->name('api.v1.support.attachment');

        Route::post('/feedback', [FeedbackController::class, 'store']);
    });
});

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'platform', 'throttle:api'])
    ->group(function (): void {
        Route::get('/admin/analytics', [AdminPlatformAnalyticsController::class, 'index']);
        Route::get('/admin/tenants', [AdminTenantController::class, 'index']);
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::patch('/admin/users/{publicId}/role', [AdminUserController::class, 'updateRole']);

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

        Route::get('/admin/manual-payments', [AdminManualPaymentController::class, 'index']);
        Route::post('/admin/manual-payments/{publicId}/approve', [AdminManualPaymentController::class, 'approve']);
        Route::post('/admin/manual-payments/{publicId}/reject', [AdminManualPaymentController::class, 'reject']);
        Route::get('/admin/manual-payments/{publicId}/screenshot', [AdminManualPaymentController::class, 'screenshot'])
            ->name('api.v1.admin.manual-payments.screenshot');
        Route::get('/admin/ai-manual-payments', [AdminAiManualPaymentController::class, 'index']);
        Route::post('/admin/ai-manual-payments/{publicId}/approve', [AdminAiManualPaymentController::class, 'approve']);
        Route::post('/admin/ai-manual-payments/{publicId}/reject', [AdminAiManualPaymentController::class, 'reject']);
        Route::get('/admin/ai-manual-payments/{publicId}/screenshot', [AdminAiManualPaymentController::class, 'screenshot'])
            ->name('api.v1.admin.ai-manual-payments.screenshot');

        Route::get('/admin/manual-payment-methods', [AdminManualPaymentMethodController::class, 'index']);
        Route::post('/admin/manual-payment-methods', [AdminManualPaymentMethodController::class, 'store']);
        Route::put('/admin/manual-payment-methods/{publicId}', [AdminManualPaymentMethodController::class, 'update']);
        Route::delete('/admin/manual-payment-methods/{publicId}', [AdminManualPaymentMethodController::class, 'destroy']);
        Route::get('/admin/manual-subscription-changes', [AdminManualSubscriptionChangeController::class, 'index']);
        Route::post('/admin/manual-subscription-changes/{publicId}/approve', [AdminManualSubscriptionChangeController::class, 'approve']);
        Route::post('/admin/manual-subscription-changes/{publicId}/reject', [AdminManualSubscriptionChangeController::class, 'reject']);

        Route::get('/admin/support/tickets', [AdminSupportTicketController::class, 'index']);
        Route::get('/admin/support/tickets/{publicId}', [AdminSupportTicketController::class, 'show']);
        Route::get('/admin/support/tickets/{publicId}/messages', [AdminSupportTicketController::class, 'messages']);
        Route::post('/admin/support/tickets/{publicId}/messages', [AdminSupportTicketController::class, 'reply']);
        Route::post('/admin/support/tickets/{publicId}/status', [AdminSupportTicketController::class, 'updateStatus']);

        Route::get('/admin/feedback', [AdminFeedbackController::class, 'index']);
    });

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'tenant', 'throttle:api'])
    ->group(function (): void {
        Route::put('/tenants', [TenantController::class, 'update']);
        Route::post('/billing/checkout', [BillingController::class, 'checkout']);
        Route::post('/billing/portal', [BillingController::class, 'portal']);
        Route::get('/billing/subscription', [BillingController::class, 'subscription']);
        Route::post('/billing/change-plan', [BillingController::class, 'changePlan']);
        Route::post('/billing/cancel', [BillingController::class, 'cancel']);
        Route::post('/billing/resume', [BillingController::class, 'resume']);
        Route::get('/billing/invoices', [BillingController::class, 'invoices']);
        Route::get('/billing/plan-limits', [BillingController::class, 'planLimits']);
        Route::get('/billing/audit-export', [BillingController::class, 'auditExport']);
        Route::get('/billing/manual-methods', [BillingController::class, 'manualMethods']);
        Route::post('/billing/manual-request', [BillingController::class, 'submitManualRequest']);
        Route::get('/billing/manual-request/status', [BillingController::class, 'manualRequestStatus']);
        Route::post('/billing/manual-subscription-change', [ManualSubscriptionChangeController::class, 'store']);
        Route::get('/billing/manual-subscription-change/status', [ManualSubscriptionChangeController::class, 'status']);
        Route::get('/billing/ai-credits', [BillingController::class, 'aiCredits']);
        Route::get('/billing/ai-ledger', [BillingController::class, 'aiLedger']);
        Route::post('/billing/ai-credit-checkout', [BillingController::class, 'aiCreditCheckout']);
        Route::post('/billing/ai-mfs-request', [BillingController::class, 'aiMfsRequest']);
        Route::get('/billing/ai-mfs-request/status', [BillingController::class, 'aiManualRequestStatus']);
        Route::get('/billing/ai-analytics', [BillingController::class, 'aiAnalytics']);
        Route::get('/billing/ai-alert-rules', [BillingController::class, 'listAiAlertRules']);
        Route::post('/billing/ai-alert-rules', [BillingController::class, 'storeAiAlertRule']);
    });

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'tenant', 'subscription.active', 'throttle:api'])
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

        Route::get('/clients/search', [ClientController::class, 'search']);
        Route::get('/clients', [ClientController::class, 'index']);
        Route::post('/clients', [ClientController::class, 'store']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);
        Route::put('/clients/{id}', [ClientController::class, 'update']);
        Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

        Route::get('/hearings/calendar', [HearingController::class, 'calendar']);
        Route::get('/hearings/daily-register', [HearingController::class, 'dailyRegister']);
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
        Route::get('/push-subscriptions', [PushSubscriptionController::class, 'index']);
        Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store']);
        Route::delete('/push-subscriptions/{endpointHash}', [PushSubscriptionController::class, 'destroy']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{publicId}', [UserController::class, 'update']);

        Route::post('/ai/hearing-summary', [AiController::class, 'hearingSummary']);
        Route::post('/ai/diary-summary', [AiController::class, 'diarySummary']);
        Route::post('/ai/research-summary', [AiController::class, 'researchSummary']);
        Route::post('/ai/document-qa', [AiController::class, 'documentQa']);
        Route::post('/ai/petition-draft', [AiController::class, 'petitionDraft']);
        Route::post('/ai/legal-sections', [AiController::class, 'legalSectionLookup']);
        Route::post('/ai/case-law', [AiController::class, 'caseLawSuggestion']);
        Route::post('/ai/next-steps', [AiController::class, 'nextSteps']);
        Route::post('/ai/client-communication', [AiController::class, 'clientCommunication']);
        Route::get('/ai/requests/{publicId}', [AiController::class, 'show']);
    });
