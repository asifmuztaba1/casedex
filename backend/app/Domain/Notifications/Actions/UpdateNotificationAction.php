<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateNotificationAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        CaseNotification $notification,
        array $data,
        ?string $casePublicId,
        ?string $hearingPublicId,
        ?string $userPublicId,
        ?Authenticatable $user
    ): CaseNotification {
        $caseId = $notification->case_id;

        if ($casePublicId !== null) {
            $caseId = $this->resolveCaseId($casePublicId);
            $data['case_id'] = $caseId;
        }

        if ($hearingPublicId !== null && $caseId !== null) {
            $data['hearing_id'] = $this->resolveHearingId($hearingPublicId, $caseId);
        }

        if ($userPublicId !== null) {
            $data['user_id'] = $this->resolveUserId($userPublicId);
        }

        $notification->fill($data);
        $notification->save();

        $this->auditLog->handle(
            'notification.updated',
            $user,
            CaseNotification::class,
            $notification->public_id
        );

        return $notification;
    }

    private function resolveCaseId(string $casePublicId): int
    {
        $caseId = CaseFile::query()
            ->where('public_id', $casePublicId)
            ->value('id');

        if ($caseId === null) {
            abort(422, 'Case not found for the provided public_id.');
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
            abort(422, 'Hearing not found for the provided public_id.');
        }

        return $hearingId;
    }

    private function resolveUserId(string $userPublicId): int
    {
        $userId = User::query()
            ->where('public_id', $userPublicId)
            ->value('id');

        if ($userId === null) {
            abort(422, 'User not found for the provided public_id.');
        }

        return $userId;
    }
}
