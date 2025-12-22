<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Models\Hearing;
use Illuminate\Contracts\Auth\Authenticatable;

class CreateHearingAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, string $casePublicId, ?Authenticatable $user): Hearing
    {
        $data['case_id'] = $this->resolveCaseId($casePublicId);

        $hearing = Hearing::create($data);

        $this->auditLog->handle(
            'hearing.created',
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
            abort(422, 'Case not found for the provided public_id.');
        }

        return $caseId;
    }
}
