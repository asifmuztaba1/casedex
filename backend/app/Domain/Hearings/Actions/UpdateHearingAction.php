<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Models\Hearing;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateHearingAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        Hearing $hearing,
        array $data,
        ?string $casePublicId,
        ?Authenticatable $user
    ): Hearing {
        if ($casePublicId !== null) {
            $data['case_id'] = $this->resolveCaseId($casePublicId);
        }

        $hearing->fill($data);
        $hearing->save();

        $this->auditLog->handle(
            'hearing.updated',
            $user,
            Hearing::class,
            $hearing->public_id
        );

        return $hearing;
    }

    private function resolveCaseId(string $casePublicId): int
    {
        $caseId = CaseFile::query()
            ->where('public_id', $casePublicId)
            ->value('id');

        if ($caseId === null) {
            abort(422, __('messages.case_not_found_public_id'));
        }

        return $caseId;
    }
}
