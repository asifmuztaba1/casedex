<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseParticipant;
use Illuminate\Contracts\Auth\Authenticatable;

class RemoveCaseParticipantAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(CaseParticipant $participant, ?Authenticatable $user): void
    {
        $participant->delete();

        $this->auditLog->handle(
            'case.participant.removed',
            $user,
            CaseParticipant::class,
            (string) $participant->id
        );
    }
}
