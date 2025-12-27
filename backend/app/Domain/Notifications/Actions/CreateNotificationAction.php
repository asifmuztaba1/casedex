<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;

class CreateNotificationAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        array $data,
        ?string $casePublicId,
        ?string $hearingPublicId,
        ?string $userPublicId,
        ?Authenticatable $user
    ): CaseNotification
    {
        $caseId = $this->resolveCaseId($casePublicId);
        $data['case_id'] = $caseId;

        if ($hearingPublicId !== null && $caseId !== null) {
            $data['hearing_id'] = $this->resolveHearingId($hearingPublicId, $caseId);
        }

        if ($userPublicId !== null) {
            $data['user_id'] = $this->resolveUserId($userPublicId);
        }

        $data['notification_type'] = $data['notification_type'] ?? 'general';
        $data['channel'] = $data['channel'] ?? 'in_app';
        $data['status'] = $data['status'] ?? 'pending';

        $notification = CaseNotification::create($data);

        $this->auditLog->handle(
            'notification.created',
            $user,
            CaseNotification::class,
            $notification->public_id
        );

        DispatchCaseNotificationJob::dispatch(
            TenantContext::id(),
            $notification->id
        );

        return $notification;
    }

    private function resolveCaseId(?string $casePublicId): ?int
    {
        if ($casePublicId === null) {
            return null;
        }

        $caseId = CaseFile::query()
            ->where('public_id', $casePublicId)
            ->value('id');

        if ($caseId === null) {
            abort(422, __('messages.case_not_found_public_id'));
        }

        return $caseId;
    }

    private function resolveHearingId(string $hearingPublicId, int $caseId): int
    {
        $hearingId = Hearing::query()
            ->where('public_id', $hearingPublicId)
            ->where('case_id', $caseId)
            ->value('id');

        if ($hearingId === null) {
            abort(422, __('messages.hearing_not_found_public_id'));
        }

        return $hearingId;
    }

    private function resolveUserId(string $userPublicId): int
    {
        $userId = User::query()
            ->where('public_id', $userPublicId)
            ->value('id');

        if ($userId === null) {
            abort(422, __('messages.user_not_found_public_id'));
        }

        return $userId;
    }
}
